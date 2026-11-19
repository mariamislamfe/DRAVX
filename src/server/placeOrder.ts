"use server";

import { randomUUID } from "node:crypto";
import { mutate } from "./db";
import { isUploadUrl, uploadExists } from "./uploads";
import {
  PAYMENT_METHODS,
  discountAmount,
  discountProblem,
  shippingFor,
  templatePrice,
  type CustomDesign,
  type Customer,
  type Order,
  type OrderItem,
  type PaymentMethod,
} from "@/data/schema";
import { readDB } from "./db";
import { adjustStock, getImage, soldOutFor, stockLeft, type Size } from "@/data/products";
import type { CartLine } from "@/lib/store";
import { formatPrice, setCurrency } from "@/config/brand";

export type PlaceOrderResult = { ok: true; number: string } | { ok: false; error: string };

const MAX_LINES = 30;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function cleanCustomer(c: Partial<Customer>): Customer | string {
  const out: Customer = {
    name: str(c.name, 120),
    phone: str(c.phone, 40),
    email: str(c.email, 160) || undefined,
    city: str(c.city, 80),
    address: str(c.address, 400),
    notes: str(c.notes, 600) || undefined,
  };
  if (out.name.length < 2) return "Please enter your full name.";
  if (!/^[+\d][\d\s()-]{6,}$/.test(out.phone)) return "Please enter a valid phone number.";
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) return "That email doesn't look right.";
  if (out.city.length < 2) return "Please enter your city.";
  if (out.address.length < 6) return "Please enter your full address.";
  return out;
}

/**
 * Creates a cash-on-delivery order. Everything the browser sends is
 * re-checked here: prices come from the catalog, never from the cart.
 */
export type DiscountCheck = { ok: true; code: string; amount: number; freeShipping: boolean; label: string } | { ok: false; error: string };

/** Lets checkout preview a code. The order total is recomputed in placeOrder. */
export async function checkDiscount(code: string, subtotal: number, shipping: number): Promise<DiscountCheck> {
  const c = str(code, 30).toUpperCase();
  if (!c) return { ok: false, error: "Enter a code." };
  const db = await readDB();
  setCurrency(db.settings.brand?.currency);
  const d = db.discounts.find((x) => x.code === c);
  const sub = Number(subtotal) || 0;
  const problem = discountProblem(d, sub);
  if (problem === "MIN") return { ok: false, error: `Spend ${formatPrice(d!.minSubtotal)} or more to use this code.` };
  if (problem || !d) return { ok: false, error: problem ?? "That code isn't valid." };
  const label = d.type === "percent" ? `${d.value}% off` : d.type === "fixed" ? `${formatPrice(d.value)} off` : "Free shipping";
  return { ok: true, code: d.code, amount: discountAmount(d, sub, Number(shipping) || 0), freeShipping: d.type === "free_shipping", label };
}

export async function placeOrder(input: {
  customer: Partial<Customer>;
  lines: CartLine[];
  zoneId?: string;
  payment?: PaymentMethod;
  discountCode?: string;
}): Promise<PlaceOrderResult> {
  const customer = cleanCustomer(input?.customer ?? {});
  if (typeof customer === "string") return { ok: false, error: customer };
  const lines = Array.isArray(input?.lines) ? input.lines.slice(0, MAX_LINES) : [];
  if (!lines.length) return { ok: false, error: "Your bag is empty." };

  // verify custom artwork files exist before taking the write lock
  for (const l of lines) {
    if (!l?.custom) continue;
    const urls = [...(l.custom.sides ?? []).flatMap((s) => [s?.designUrl, s?.mockupUrl]), ...(l.custom.originals ?? [])];
    for (const u of urls) {
      if (!isUploadUrl(u) || !(await uploadExists(u))) return { ok: false, error: "One of your custom designs is missing. Please recreate it." };
    }
  }

  try {
    return await mutate((db): PlaceOrderResult => {
      const items: OrderItem[] = [];
      for (const l of lines) {
        const qty = Math.floor(Number(l.qty));
        if (!(qty >= 1 && qty <= 10)) return { ok: false, error: "Invalid quantity." };

        if (l.custom) {
          const t = db.templates.find((x) => x.id === l.custom!.templateId && x.active);
          if (!t || !db.settings.customizerEnabled) return { ok: false, error: "A custom item is no longer available." };
          const color = t.colors.find((c) => c.id === l.custom!.colorId);
          if (!color) return { ok: false, error: "The colour for your custom item is no longer available." };
          if (!t.sizes.includes(l.size)) return { ok: false, error: `Size ${l.size} isn't available for ${t.name}.` };
          const seen = new Set<string>();
          const sides = (l.custom.sides ?? []).filter((s) => {
            const ok = t.views.some((v) => v.enabled && v.side === s.side) && !seen.has(s.side);
            seen.add(s.side);
            return ok;
          });
          if (!sides.length) return { ok: false, error: "Your custom item has no design on it." };
          const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 10) / 10 : 0);
          const custom: CustomDesign = {
            templateId: t.id,
            templateName: t.name,
            colorId: color.id,
            colorName: color.name,
            colorHex: color.hex,
            note: str(l.custom.note, 400) || undefined,
            originals: (l.custom.originals ?? []).slice(0, 12),
            sides: sides.map((s) => ({
              side: s.side,
              designUrl: s.designUrl,
              mockupUrl: s.mockupUrl,
              areaWidthCm: num(s.areaWidthCm),
              areaHeightCm: num(s.areaHeightCm),
              artWidthCm: num(s.artWidthCm),
              artHeightCm: num(s.artHeightCm),
              artTopCm: num(s.artTopCm),
              artLeftCm: num(s.artLeftCm),
              dpi: Math.round(Number(s.dpi)) || 150,
              layers: (s.layers ?? []).slice(0, 20).map((x) => ({ type: x.type === "text" ? "text" : "image", label: str(x.label, 120) })),
            })),
          };
          items.push({
            kind: "custom",
            name: `${t.name} (custom)`,
            size: l.size,
            colorName: color.name,
            qty,
            unitPrice: templatePrice(t, custom.sides.map((s) => s.side)),
            image: custom.sides[0].mockupUrl,
            custom,
          });
          continue;
        }

        const p = db.products.find((x) => x.slug === l.slug && x.active);
        if (!p) return { ok: false, error: "An item in your bag is no longer available." };
        // bags from before the product had colours carry none: use the default
        const color = p.colors?.length ? (l.color ? p.colors.find((c) => c.id === l.color) : p.colors[0]) : undefined;
        if (p.colors?.length && !color) return { ok: false, error: `That colour of ${p.name} is no longer available.` };
        const what = color ? `${p.name} in ${color.name}, size ${l.size}` : `${p.name} in ${l.size}`;
        if (!p.sizes.includes(l.size) || soldOutFor(p, color?.id).includes(l.size as Size)) return { ok: false, error: `${what} just sold out.` };
        const tracked = stockLeft(p, color?.id, l.size as Size);
        if (tracked !== undefined) {
          const wanted = qty + items.filter((i) => i.slug === p.slug && i.size === l.size && i.color === color?.id).reduce((n, i) => n + i.qty, 0);
          if (wanted > tracked) return { ok: false, error: `Only ${tracked} left of ${what}.` };
        }
        const variant = l.variant ? p.printVariants?.find((v) => v.id === l.variant) : undefined;
        if (l.variant && !variant) return { ok: false, error: `That print for ${p.name} is no longer available.` };
        const img = getImage(p, "back", variant?.id, color?.id);
        items.push({
          kind: "product",
          slug: p.slug,
          name: p.name,
          size: l.size,
          variant: variant?.id,
          variantLabel: variant?.label,
          color: color?.id,
          colorName: color?.name ?? p.colorName,
          qty,
          unitPrice: p.price,
          image: img.cutout ?? img.src,
        });
      }

      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

      // delivery zone: required once the store has zones
      const zones = db.settings.shippingZones ?? [];
      const zone = zones.find((z) => z.id === input.zoneId);
      if (zones.length && !zone) return { ok: false, error: "Please choose your delivery area." };
      // copy: with Neon this callback can run again after a write conflict
      const buyer = { ...customer };
      if (zone) buyer.city = buyer.city.toLowerCase() === zone.name.toLowerCase() ? zone.name : `${zone.name} · ${buyer.city}`;
      let shipping = shippingFor(db.settings, subtotal, zone?.id);

      const payment = PAYMENT_METHODS.includes(input.payment as PaymentMethod) ? (input.payment as PaymentMethod) : "cod";
      if (!db.settings.payments?.[payment]?.enabled) return { ok: false, error: "That payment method isn't available. Please pick another." };

      let discount: Order["discount"];
      const code = str(input.discountCode, 30).toUpperCase();
      if (code) {
        const d = db.discounts.find((x) => x.code === code);
        const problem = discountProblem(d, subtotal);
        if (problem || !d) return { ok: false, error: problem === "MIN" ? "Your bag is below the minimum for that code." : problem ?? "That code isn't valid." };
        // free shipping zeroes the fee instead of taking money off the items
        discount = { code: d.code, amount: d.type === "free_shipping" ? 0 : discountAmount(d, subtotal, shipping) };
        if (d.type === "free_shipping") shipping = 0;
        d.uses += 1;
      }

      // take tracked stock
      for (const it of items) {
        const p = it.slug ? db.products.find((x) => x.slug === it.slug) : undefined;
        if (p) adjustStock(p, it.color, it.size, -it.qty);
      }
      const now = new Date().toISOString();
      db.seq += 1;
      const order: Order = {
        id: randomUUID(),
        number: `DRX-${db.seq}`,
        createdAt: now,
        updatedAt: now,
        status: "pending",
        customer: buyer,
        items,
        subtotal,
        shipping,
        total: Math.max(0, subtotal - (discount?.amount ?? 0)) + shipping,
        payment,
        discount,
        history: [{ at: now, status: "pending" }],
      };
      db.orders.unshift(order);

      // dashboard notification
      setCurrency(db.settings.brand?.currency);
      const custom = items.filter((i) => i.custom).length;
      const pieces = items.reduce((s, i) => s + i.qty, 0);
      (db.notifications ??= []).unshift({
        id: randomUUID(),
        at: now,
        kind: custom ? "custom-order" : "order",
        title: `New order ${order.number}${custom ? " · custom design" : ""}`,
        body: `${buyer.name} · ${buyer.city} · ${pieces} item${pieces === 1 ? "" : "s"} · ${formatPrice(order.total)}`,
        href: `/admin/orders/${order.id}`,
        read: false,
      });
      db.notifications.length = Math.min(db.notifications.length, 300);
      return { ok: true, number: order.number };
    });
  } catch (e) {
    console.error("placeOrder failed", e);
    return { ok: false, error: "We couldn't place your order. Please try again." };
  }
}
