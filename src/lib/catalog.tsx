"use client";

import { createContext, useContext } from "react";
import type { Catalog } from "@/data/schema";

const Ctx = createContext<Catalog | null>(null);

export function CatalogProvider({ value, children }: { value: Catalog; children: React.ReactNode }) {
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

export { byWorld } from "@/data/products";
