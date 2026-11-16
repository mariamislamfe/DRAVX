import { getProduct, type Product } from "@/data/products";
import type { CartLine } from "./store";

export type ResolvedLine = CartLine & { product: Product; lineTotal: number };

export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  return lines.flatMap((l) => {
    const product = getProduct(l.slug);
    return product ? [{ ...l, product, lineTotal: product.price * l.qty }] : [];
  });
}

export function cartTotals(lines: CartLine[]) {
  const resolved = resolveLines(lines);
  const subtotal = resolved.reduce((s, l) => s + l.lineTotal, 0);
  const count = resolved.reduce((s, l) => s + l.qty, 0);
  return { resolved, subtotal, count };
}
