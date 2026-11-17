import type { Product } from "@/data/products";
import { templatePrice, type Catalog } from "@/data/schema";
import type { CartLine } from "./store";

export type ResolvedLine = CartLine & {
  product?: Product;
  name: string;
  meta: string;
  unitPrice: number;
  lineTotal: number;
  href: string;
  /** mockup image for custom lines */
  thumb?: string;
};

export function resolveLines(lines: CartLine[], catalog: Catalog): ResolvedLine[] {
  return lines.flatMap((l): ResolvedLine[] => {
    if (l.custom) {
      const t = catalog.templates.find((x) => x.id === l.custom!.templateId);
      if (!t) return [];
      const unitPrice = templatePrice(t, l.custom.sides.map((s) => s.side));
      const sides = l.custom.sides.map((s) => s.side).join(" + ");
      return [
        {
          ...l,
          name: `${t.name} (your design)`,
          meta: `${l.custom.colorName} · Size ${l.size} · ${sides}`,
          unitPrice,
          lineTotal: unitPrice * l.qty,
          href: "/customize",
          thumb: l.custom.sides.find((s) => s.side === "back")?.mockupUrl ?? l.custom.sides[0]?.mockupUrl,
        },
      ];
    }
    const product = catalog.products.find((p) => p.slug === l.slug);
    if (!product) return [];
    const variant = product.printVariants?.find((v) => v.id === l.variant);
    return [
      {
        ...l,
        product,
        name: product.name,
        meta: `${product.colorName} · Size ${l.size}${variant ? ` · ${variant.label}` : ""}`,
        unitPrice: product.price,
        lineTotal: product.price * l.qty,
        href: `/product/${product.slug}`,
      },
    ];
  });
}

export function cartTotals(lines: CartLine[], catalog: Catalog) {
  const resolved = resolveLines(lines, catalog);
  const subtotal = resolved.reduce((s, l) => s + l.lineTotal, 0);
  const count = resolved.reduce((s, l) => s + l.qty, 0);
  const { shippingFee, freeShippingThreshold } = catalog.settings;
  const shipping = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : shippingFee;
  return { resolved, subtotal, count, shipping, total: subtotal + shipping };
}
