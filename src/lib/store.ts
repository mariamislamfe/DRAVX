"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { Size } from "@/data/products";
import type { CustomDesign } from "@/data/schema";

export type CartLine = {
  key: string; // slug|size|variant|color, or custom|<id> for customizer designs
  slug: string; // template id for custom lines
  size: Size;
  variant?: string;
  /** Colour id, for products sold in several colours. */
  color?: string;
  qty: number;
  custom?: CustomDesign;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const MAX_QTY = 10;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, qty = 1) =>
        set((s) => {
          const key = line.custom ? `custom|${crypto.randomUUID()}` : [line.slug, line.size, line.variant ?? "", line.color ?? ""].join("|");
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l)),
            };
          }
          return { lines: [...s.lines, { ...line, key, qty: Math.min(MAX_QTY, qty) }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "dravx-cart", storage: createJSONStorage(() => localStorage), version: 1 }
  )
);

export type Phase = "preloading" | "transitioning" | "ready";

type UIState = {
  phase: Phase;
  setPhase: (p: Phase) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  /** increments on each add-to-cart, used for header bump feedback */
  bump: number;
  pulse: () => void;
};

export const useUI = create<UIState>()((set) => ({
  phase: "preloading",
  setPhase: (phase) => set({ phase }),
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  bump: 0,
  pulse: () => set((s) => ({ bump: s.bump + 1 })),
}));

/** True after client mount — guards persisted state against hydration mismatch. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
