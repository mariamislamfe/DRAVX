"use client";

import { createContext, useContext, useMemo } from "react";
import type { Catalog } from "@/data/schema";
import { setCurrency } from "@/config/brand";
import { makeT, type T } from "@/data/content";
import type { World } from "@/data/products";

const Ctx = createContext<Catalog | null>(null);

export function CatalogProvider({ value, children }: { value: Catalog; children: React.ReactNode }) {
  // before children render, so every formatPrice below uses the store currency
  setCurrency(value.settings.brand?.currency);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog(): Catalog {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return c;
}

export function findProduct(catalog: Catalog, slug: string) {
  return catalog.products.find((p) => p.slug === slug);
}

/** Site text, as edited in Dashboard → Site text. */
export function useText(): T {
  const text = useCatalog().settings.text;
  return useMemo(() => makeT(text), [text]);
}

/** A world's display name. */
export const worldLabel = (t: T, w: World) => t(`world.${w}.label`);

export { byWorld, pickProduct } from "@/data/products";
