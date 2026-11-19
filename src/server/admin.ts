"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate } from "./db";
import { MIN_PASSWORD, checkPassword, endSession, hashPassword, requireAdmin, startSession } from "./auth";
import { SIZES, WORLD_IDS, type ImageKind, type Product, type ProductColor, type Size } from "@/data/products";
import {
  DEFAULT_BRAND,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  slugify,
  type BrandInfo,
  type Category,
  type CustomTemplate,
  type DB,
  type Discount,
  type Order,
  type OrderStatus,
  type PaymentSettings,
  type ShippingZone,
  type Side,
  type SizeChart,
} from "@/data/schema";
import { INTEGRATIONS } from "@/data/integrations";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const refresh = () => revalidatePath("/", "layout");
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown, min = 0, max = 1e7) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};
const IMG_URL = /^\/(uploads|products|customizer)\/[\w./-]+$/;
const imgUrl = (v: unknown) => (typeof v === "string" && IMG_URL.test(v) && !v.includes("..") ? v : undefined);
const sizes = (v: unknown): Size[] => (Array.isArray(v) ? SIZES.filter((s) => v.includes(s)) : []);

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export async function login(_: unknown, form: FormData): Promise<{ error?: string }> {
  // small constant delay to blunt password guessing
  await new Promise((r) => setTimeout(r, 400));
  if (!(await checkPassword(String(form.get("password") ?? "")))) return { error: "Wrong password." };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function changePassword(_: unknown, form: FormData): Promise<{ saved?: boolean; error?: string }> {
  await requireAdmin();
  // same small delay as sign-in, so the current-password check can't be hammered
  await new Promise((r) => setTimeout(r, 400));
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!(await checkPassword(current))) return { error: "Current password is wrong." };
  if (next.length < MIN_PASSWORD) return { error: `Use at least ${MIN_PASSWORD} characters.` };
  if (next.length > 200) return { error: "That password is too long." };
  if (next !== String(form.get("confirm") ?? "")) return { error: "The two new passwords don't match." };
  if (next === current) return { error: "Pick a password different from the current one." };
  const h = hashPassword(next);
  await mutate((db) => {
    db.admin = h;
  });
  // the session key comes from the password: re-issue ours, every other device is signed out
  await startSession();
  revalidatePath("/admin", "layout");
  return { saved: true };
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function saveCategory(input: Partial<Category> & { originalId?: string }): Promise<ActionResult> {
  await requireAdmin();
  const name = str(input.name, 60);
  if (!name) return { ok: false, error: "Name is required." };
  const id = slugify(str(input.id, 60) || name);
  if (!id) return { ok: false, error: "Use letters or numbers in the name." };
  const res = await mutate((db): ActionResult => {
    const existing = input.originalId ? db.categories.find((c) => c.id === input.originalId) : undefined;
    if (db.categories.some((c) => c.id === id && c !== existing)) return { ok: false, error: `A category with id “${id}” already exists.` };
    const next: Category = {
      id,
      name,
      description: str(input.description, 300) || undefined,
      order: Math.round(num(input.order, 0, 999)),
      active: input.active !== false,
      sizeChart: cleanChart(input.sizeChart),
    };
    if (existing) {
      if (existing.id !== id) {
        db.products.forEach((p) => p.categoryId === existing.id && (p.categoryId = id));
        db.templates.forEach((t) => t.categoryId === existing.id && (t.categoryId = id));
      }
      Object.assign(existing, next);
    } else db.categories.push(next);
    return { ok: true, id };
  });
  refresh();
  return res;
}

/** Keep a size chart rectangular and bounded; empty chart → no size guide. */
function cleanChart(c: unknown): SizeChart | undefined {
  if (!c || typeof c !== "object") return undefined;
  const v = c as Partial<SizeChart>;
  const sizes = (Array.isArray(v.sizes) ? v.sizes : []).map((s) => str(s, 12)).filter(Boolean).slice(0, 12);
  if (!sizes.length) return undefined;
  const rows = (Array.isArray(v.rows) ? v.rows : [])
    .map((r) => ({
      label: str(r?.label, 40),
      values: sizes.map((_, i) => str(Array.isArray(r?.values) ? r.values[i] : "", 16)),
    }))
    .filter((r) => r.label)
    .slice(0, 12);
  if (!rows.length) return undefined;
  return { intro: str(v.intro, 400), sizes, rows };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const res = await mutate((db): ActionResult => {
    const used = db.products.filter((p) => p.categoryId === id).length + db.templates.filter((t) => t.categoryId === id).length;
    if (used) return { ok: false, error: `Move or delete the ${used} item(s) in this category first.` };
    db.categories = db.categories.filter((c) => c.id !== id);
    return { ok: true };
  });
  refresh();
  return res;
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

const KINDS: ImageKind[] = ["front", "back", "detail-front", "detail-back", "model", "campaign"];

export async function saveProduct(input: Product & { originalSlug?: string }): Promise<ActionResult> {
  await requireAdmin();
  const name = str(input.name, 120);
  if (!name) return { ok: false, error: "Name is required." };
  const slug = slugify(str(input.slug, 80) || name);
  if (!slug) return { ok: false, error: "Slug needs letters or numbers." };
  const price = num(input.price, 0, 1e6);
  const productSizes = sizes(input.sizes);
  if (!productSizes.length) return { ok: false, error: "Pick at least one size." };

  const variants = (Array.isArray(input.printVariants) ? input.printVariants : [])
    .map((v, i) => ({ id: slugify(str(v.id) || str(v.label)), label: str(v.label, 60), note: str(v.note, 10) || String(i + 1).padStart(2, "0") }))
    .filter((v) => v.id && v.label);
  const variantIds = new Set(variants.map((v) => v.id));

  const hex = (h: unknown, fallback: string) => (typeof h === "string" && /^#[0-9a-f]{6}$/i.test(h) ? h : fallback);
  const colors: ProductColor[] = [];
  for (const c of Array.isArray(input.colors) ? input.colors.slice(0, 30) : []) {
    const cname = str(c?.name, 60);
    const id = slugify(str(c?.id) || cname);
    if (!cname || !id || colors.some((x) => x.id === id)) continue;
    colors.push({ id, name: cname, hex: hex(c.hex, "#111111") });
  }
  const colorIds = new Set(colors.map((c) => c.id));

  const product: Product = {
    slug,
    categoryId: str(input.categoryId, 60),
    active: input.active !== false,
    name,
    shortName: str(input.shortName, 60) || name,
    world: WORLD_IDS.includes(input.world) ? input.world : "nightshift",
    price,
    // the first colour is the default the rest of the store shows
    colorName: colors[0]?.name ?? str(input.colorName, 60),
    colorHex: colors[0]?.hex ?? hex(input.colorHex, "#111111"),
    colors: colors.length ? colors : undefined,
    tagline: str(input.tagline, 200),
    description: str(input.description, 3000),
    story: str(input.story, 2000),
    details: (Array.isArray(input.details) ? input.details : []).map((d) => str(d, 200)).filter(Boolean).slice(0, 20),
    fit: str(input.fit, 600),
    sizes: productSizes,
    soldOut: sizes(input.soldOut).filter((s) => productSizes.includes(s)),
    printVariants: variants.length ? variants : undefined,
    images: (Array.isArray(input.images) ? input.images : [])
      .filter((im) => KINDS.includes(im.kind))
      .map((im) => ({
        kind: im.kind,
        alt: str(im.alt, 200) || `${name} ${im.kind}`,
        src: imgUrl(im.src),
        cutout: imgUrl(im.cutout),
        variant: im.variant && variantIds.has(im.variant) ? im.variant : undefined,
        color: im.color && colorIds.has(im.color) ? im.color : undefined,
      }))
      .slice(0, 40),
    badge: str(input.badge, 40) || undefined,
    rank: Math.round(num(input.rank, 0, 9999)),
    addedAt: /^\d{4}-\d{2}-\d{2}/.test(input.addedAt) ? input.addedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
  if (!product.images.length) product.images = [{ kind: "front", alt: `${name} front` }];

  const res = await mutate((db): ActionResult => {
    if (!db.categories.some((c) => c.id === product.categoryId)) return { ok: false, error: "Choose a category." };
    const existing = input.originalSlug ? db.products.find((p) => p.slug === input.originalSlug) : undefined;
    if (db.products.some((p) => p.slug === slug && p !== existing)) return { ok: false, error: `Another product already uses the URL “${slug}”.` };
    if (existing) Object.assign(existing, product);
    else db.products.push(product);
    return { ok: true, id: slug };
  });
  refresh();
  return res;
}

export async function setProductActive(slug: string, active: boolean) {
  await requireAdmin();
  await mutate((db) => {
    const p = db.products.find((x) => x.slug === slug);
    if (p) p.active = active;
  });
  refresh();
}

export async function deleteProduct(slug: string) {
  await requireAdmin();
  await mutate((db) => {
    db.products = db.products.filter((p) => p.slug !== slug);
  });
  refresh();
  redirect("/admin/products");
}

/* ------------------------------------------------------------------ */
/* Customizer templates                                                */
/* ------------------------------------------------------------------ */

export async function saveTemplate(input: CustomTemplate & { originalId?: string }): Promise<ActionResult> {
  await requireAdmin();
  const name = str(input.name, 80);
  if (!name) return { ok: false, error: "Name is required." };
  const id = slugify(str(input.id, 60) || name);
  const views = (["front", "back"] as Side[]).map((side) => {
    const v = (Array.isArray(input.views) ? input.views : []).find((x) => x.side === side);
    const area = {
      x: num(v?.area?.x, 0, 1),
      y: num(v?.area?.y, 0, 1),
      w: num(v?.area?.w, 0.02, 1),
      h: num(v?.area?.h, 0.02, 1),
    };
    area.w = Math.min(area.w, 1 - area.x);
    area.h = Math.min(area.h, 1 - area.y);
    return {
      side,
      enabled: Boolean(v?.enabled && imgUrl(v.mockup)),
      mockup: imgUrl(v?.mockup) ?? "",
      mockupW: Math.round(num(v?.mockupW, 1, 20000)),
      mockupH: Math.round(num(v?.mockupH, 1, 20000)),
      area,
      printWidthCm: num(v?.printWidthCm, 1, 200),
      printPrice: num(v?.printPrice, 0, 1e5),
    };
  });
  if (!views.some((v) => v.enabled)) return { ok: false, error: "Enable at least one side and give it a mockup image." };
  const colors = (Array.isArray(input.colors) ? input.colors : [])
    .map((c) => {
      const photos = { front: imgUrl(c.photos?.front), back: imgUrl(c.photos?.back) };
      return {
        id: slugify(str(c.name, 40)) || slugify(str(c.id)),
        name: str(c.name, 40),
        hex: /^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#ffffff",
        ...(photos.front || photos.back ? { photos: Object.fromEntries(Object.entries(photos).filter(([, u]) => u)) } : {}),
      };
    })
    .filter((c, i, a) => c.id && c.name && a.findIndex((x) => x.id === c.id) === i);
  if (!colors.length) return { ok: false, error: "Add at least one colour." };
  const tSizes = sizes(input.sizes);
  if (!tSizes.length) return { ok: false, error: "Pick at least one size." };

  const tpl: CustomTemplate = {
    id,
    name,
    categoryId: str(input.categoryId, 60),
    description: str(input.description, 400) || undefined,
    basePrice: num(input.basePrice, 0, 1e6),
    sizes: tSizes,
    colors,
    views,
    tint: input.tint !== false,
    active: input.active !== false,
    order: Math.round(num(input.order, 0, 999)),
  };
  const res = await mutate((db): ActionResult => {
    if (!db.categories.some((c) => c.id === tpl.categoryId)) return { ok: false, error: "Choose a category." };
    const existing = input.originalId ? db.templates.find((t) => t.id === input.originalId) : undefined;
    if (db.templates.some((t) => t.id === id && t !== existing)) return { ok: false, error: `A base with id “${id}” already exists.` };
    if (existing) Object.assign(existing, tpl);
    else db.templates.push(tpl);
    return { ok: true, id };
  });
  refresh();
  return res;
}

export async function deleteTemplate(id: string) {
  await requireAdmin();
  await mutate((db) => {
    db.templates = db.templates.filter((t) => t.id !== id);
  });
  refresh();
  redirect("/admin/customizer");
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export async function updateOrder(id: string, form: FormData) {
  await requireAdmin();
  const status = String(form.get("status") ?? "") as OrderStatus;
  const note = form.has("adminNote") ? str(form.get("adminNote"), 2000) : undefined;
  await mutate((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o) return;
    const now = new Date().toISOString();
    if (ORDER_STATUSES.includes(status) && status !== o.status) {
      // cancelling puts tracked stock back; un-cancelling takes it again
      if (status === "cancelled" && !o.restocked) {
        moveStock(db, o, +1);
        o.restocked = true;
      } else if (o.status === "cancelled" && o.restocked) {
        moveStock(db, o, -1);
        o.restocked = false;
      }
      o.status = status;
      o.history.push({ at: now, status });
    }
    if (note !== undefined) o.adminNote = note || undefined;
    o.updatedAt = now;
  });
  revalidatePath("/admin", "layout");
}

export async function deleteOrder(id: string) {
  await requireAdmin();
  await mutate((db) => {
    db.orders = db.orders.filter((o) => o.id !== id);
  });
  revalidatePath("/admin", "layout");
  redirect("/admin/orders");
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export async function saveSettings(_: unknown, form: FormData): Promise<{ saved?: boolean; error?: string }> {
  await requireAdmin();
  const b = (k: keyof BrandInfo, max = 200) => str(form.get(`brand.${k}`), max);
  const currency = b("currency", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency must be a 3-letter code, e.g. EGP or USD." };
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency });
  } catch {
    return { error: `“${currency}” isn't a currency code.` };
  }
  const siteUrl = b("siteUrl").replace(/\/+$/, "");
  if (siteUrl && !/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(siteUrl)) return { error: "Website address must start with https://" };
  const email = b("email", 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email address doesn't look right." };

  await mutate((db) => {
    // shipping & returns text is edited on the Shipping page
    const { shippingInfo, returnsInfo } = db.settings.brand;
    db.settings.brand = {
      name: b("name", 60) || DEFAULT_BRAND.name,
      tagline: b("tagline", 120),
      description: b("description", 400),
      siteUrl: siteUrl || DEFAULT_BRAND.siteUrl,
      currency,
      email,
      phone: b("phone", 40),
      whatsapp: b("whatsapp", 40),
      instagram: b("instagram"),
      tiktok: b("tiktok"),
      facebook: b("facebook"),
      shippingInfo,
      returnsInfo,
    };
    db.settings.customizerEnabled = form.get("customizerEnabled") === "on";
  });
  refresh();
  return { saved: true };
}

/* ------------------------------------------------------------------ */
/* Shipping                                                            */
/* ------------------------------------------------------------------ */

export async function saveShipping(_: unknown, form: FormData): Promise<{ saved?: boolean; error?: string }> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("zones") ?? "[]"));
  } catch {
    return { error: "Couldn't read the zones. Reload and try again." };
  }
  const zones: ShippingZone[] = [];
  for (const z of Array.isArray(raw) ? raw.slice(0, 60) : []) {
    const name = str(z?.name, 60);
    if (!name) continue;
    let id = slugify(name) || `zone-${zones.length + 1}`;
    while (zones.some((x) => x.id === id)) id += "-2";
    zones.push({ id, name, fee: num(z?.fee, 0, 1e5), days: str(z?.days, 30) || undefined });
  }
  await mutate((db) => {
    db.settings.shippingFee = num(form.get("shippingFee"), 0, 1e5);
    db.settings.freeShippingThreshold = num(form.get("freeShippingThreshold"), 0, 1e7);
    db.settings.shippingZones = zones;
    db.settings.brand.shippingInfo = str(form.get("shippingInfo"), 1500);
    db.settings.brand.returnsInfo = str(form.get("returnsInfo"), 1500);
  });
  refresh();
  return { saved: true };
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export async function savePayments(_: unknown, form: FormData): Promise<{ saved?: boolean; error?: string }> {
  await requireAdmin();
  const p = Object.fromEntries(
    PAYMENT_METHODS.map((m) => [m, { enabled: form.get(`${m}.enabled`) === "on", details: str(form.get(`${m}.details`), 600) }])
  ) as PaymentSettings;
  if (!PAYMENT_METHODS.some((m) => p[m].enabled)) return { error: "Keep at least one payment method on." };
  for (const m of ["instapay", "wallet"] as const) {
    if (p[m].enabled && !p[m].details) return { error: "Add the account or number customers should pay to." };
  }
  await mutate((db) => {
    db.settings.payments = p;
  });
  refresh();
  return { saved: true };
}

/* ------------------------------------------------------------------ */
/* Discounts                                                           */
/* ------------------------------------------------------------------ */

export async function saveDiscount(_: unknown, form: FormData): Promise<{ saved?: boolean; error?: string }> {
  await requireAdmin();
  const code = str(form.get("code"), 30).toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return { error: "Code: 3–30 letters or numbers, no spaces." };
  const type = String(form.get("type"));
  if (type !== "percent" && type !== "fixed" && type !== "free_shipping") return { error: "Pick a discount type." };
  const value = type === "free_shipping" ? 0 : num(form.get("value"), 0, type === "percent" ? 100 : 1e6);
  if (type !== "free_shipping" && value <= 0) return { error: "Enter how much the code takes off." };
  const expires = str(form.get("expiresAt"), 10);
  const original = str(form.get("originalCode"), 30);
  const res = await mutate((db): { saved?: boolean; error?: string } => {
    const existing = original ? db.discounts.find((d) => d.code === original) : undefined;
    if (db.discounts.some((d) => d.code === code && d !== existing)) return { error: `${code} already exists.` };
    const next: Discount = {
      code,
      type,
      value,
      minSubtotal: num(form.get("minSubtotal"), 0, 1e7),
      maxUses: Math.round(num(form.get("maxUses"), 0, 1e7)),
      uses: existing?.uses ?? 0,
      expiresAt: /^\d{4}-\d{2}-\d{2}$/.test(expires) ? expires : undefined,
      active: form.get("active") === "on",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    if (existing) Object.assign(existing, next);
    else db.discounts.unshift(next);
    return { saved: true };
  });
  revalidatePath("/admin", "layout");
  return res;
}

export async function setDiscountActive(code: string, active: boolean) {
  await requireAdmin();
  await mutate((db) => {
    const d = db.discounts.find((x) => x.code === code);
    if (d) d.active = active;
  });
  revalidatePath("/admin", "layout");
}

export async function deleteDiscount(code: string) {
  await requireAdmin();
  await mutate((db) => {
    db.discounts = db.discounts.filter((d) => d.code !== code);
  });
  revalidatePath("/admin", "layout");
}

/* ------------------------------------------------------------------ */
/* Inventory                                                           */
/* ------------------------------------------------------------------ */

/** rows: slug → size → units (null = don't track this size). */
export async function saveInventory(rows: Record<string, Record<string, number | null>>): Promise<ActionResult> {
  await requireAdmin();
  await mutate((db) => {
    for (const p of db.products) {
      const row = rows?.[p.slug];
      if (!row || typeof row !== "object") continue;
      const stock: Partial<Record<Size, number>> = {};
      for (const sz of p.sizes) {
        const v = row[sz];
        if (v === null || v === undefined || !Number.isFinite(Number(v))) continue;
        stock[sz] = Math.round(num(v, 0, 1e6));
      }
      p.stock = Object.keys(stock).length ? stock : undefined;
      // tracked sizes sell out at 0 and come back when restocked
      p.soldOut = p.sizes.filter((sz) => (sz in stock ? stock[sz]! <= 0 : p.soldOut.includes(sz)));
    }
  });
  refresh();
  return { ok: true };
}

/** Add (+1) or take (-1) an order's items back into tracked stock. */
function moveStock(db: DB, o: Order, dir: 1 | -1) {
  for (const it of o.items) {
    const p = it.slug ? db.products.find((x) => x.slug === it.slug) : undefined;
    if (!p?.stock || !(it.size in p.stock)) continue;
    const left = Math.max(0, (p.stock[it.size] ?? 0) + dir * it.qty);
    p.stock[it.size] = left;
    p.soldOut = left > 0 ? p.soldOut.filter((s) => s !== it.size) : [...new Set([...p.soldOut, it.size])];
  }
}

/* ------------------------------------------------------------------ */
/* Integrations                                                        */
/* ------------------------------------------------------------------ */

export async function saveIntegration(id: string, _: unknown, form: FormData): Promise<{ saved?: boolean; error?: string }> {
  await requireAdmin();
  const provider = INTEGRATIONS.find((p) => p.id === id);
  if (!provider) return { error: "Unknown integration." };
  const res = await mutate((db): { saved?: boolean; error?: string } => {
    const prev = db.integrations[id]?.fields ?? {};
    const fields: Record<string, string> = {};
    for (const f of provider.fields) {
      const v = str(form.get(f.key), 2000);
      // secret inputs are left empty to keep the saved value
      fields[f.key] = f.secret && !v ? prev[f.key] ?? "" : v;
    }
    const enabled = form.get("enabled") === "on";
    const missing = provider.fields.find((f) => f.key !== "mode" && !fields[f.key]);
    if (enabled && missing) return { error: `${missing.label} is needed to switch ${provider.name} on.` };
    db.integrations[id] = { enabled, fields, updatedAt: new Date().toISOString() };
    return { saved: true };
  });
  revalidatePath("/admin", "layout");
  return res;
}

export async function disconnectIntegration(id: string) {
  await requireAdmin();
  await mutate((db) => {
    delete db.integrations[id];
  });
  revalidatePath("/admin", "layout");
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

/** Mark some (or, with no ids, all) notifications as read. */
export async function markNoticesRead(ids?: string[]) {
  await requireAdmin();
  await mutate((db) => {
    for (const n of db.notifications) if (!ids || ids.includes(n.id)) n.read = true;
  });
  revalidatePath("/admin", "layout");
}

export async function clearNotices() {
  await requireAdmin();
  await mutate((db) => {
    db.notifications = db.notifications.filter((n) => !n.read);
  });
  revalidatePath("/admin", "layout");
}
