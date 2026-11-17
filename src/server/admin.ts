"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate } from "./db";
import { checkPassword, endSession, requireAdmin, startSession } from "./auth";
import { SIZES, WORLD_IDS, type ImageKind, type Product, type Size } from "@/data/products";
import { ORDER_STATUSES, slugify, type Category, type CustomTemplate, type OrderStatus, type Settings, type Side } from "@/data/schema";

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
  if (!checkPassword(String(form.get("password") ?? ""))) return { error: "Wrong password." };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
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

  const product: Product = {
    slug,
    categoryId: str(input.categoryId, 60),
    active: input.active !== false,
    name,
    shortName: str(input.shortName, 60) || name,
    world: WORLD_IDS.includes(input.world) ? input.world : "nightshift",
    price,
    colorName: str(input.colorName, 60),
    colorHex: /^#[0-9a-f]{6}$/i.test(input.colorHex) ? input.colorHex : "#111111",
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

export async function saveSettings(_: unknown, form: FormData): Promise<{ saved?: boolean }> {
  await requireAdmin();
  const s: Settings = {
    shippingFee: num(form.get("shippingFee"), 0, 1e5),
    freeShippingThreshold: num(form.get("freeShippingThreshold"), 0, 1e7),
    customizerEnabled: form.get("customizerEnabled") === "on",
  };
  await mutate((db) => {
    db.settings = s;
  });
  refresh();
  return { saved: true };
}
