"use server";

import { randomUUID } from "node:crypto";
import { mutate } from "./db";
import { isUploadUrl, uploadExists } from "./uploads";
import { templatePrice, type CustomDesign, type Customer, type Order, type OrderItem } from "@/data/schema";
import { getImage, type Size } from "@/data/products";
import type { CartLine } from "@/lib/store";

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
export async function placeOrder(input: { customer: Partial<Customer>; lines: CartLine[] }): Promise<PlaceOrderResult> {
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
        if (!p.sizes.includes(l.size) || p.soldOut.includes(l.size as Size)) return { ok: false, error: `${p.name} in ${l.size} just sold out.` };
        const variant = l.variant ? p.printVariants?.find((v) => v.id === l.variant) : undefined;
        if (l.variant && !variant) return { ok: false, error: `That print for ${p.name} is no longer available.` };
        const img = getImage(p, "back", variant?.id);
        items.push({
          kind: "product",
          slug: p.slug,
          name: p.name,
          size: l.size,
          variant: variant?.id,
          variantLabel: variant?.label,
          colorName: p.colorName,
          qty,
          unitPrice: p.price,
          image: img.cutout ?? img.src,
        });
      }

      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
      const shipping = subtotal >= db.settings.freeShippingThreshold ? 0 : db.settings.shippingFee;
      const now = new Date().toISOString();
      db.seq += 1;
      const order: Order = {
        id: randomUUID(),
        number: `DRX-${db.seq}`,
        createdAt: now,
        updatedAt: now,
        status: "pending",
        customer,
        items,
        subtotal,
        shipping,
        total: subtotal + shipping,
        payment: "cod",
        history: [{ at: now, status: "pending" }],
      };
      db.orders.unshift(order);
      return { ok: true, number: order.number };
    });
  } catch (e) {
    console.error("placeOrder failed", e);
    return { ok: false, error: "We couldn't place your order. Please try again." };
  }
}
