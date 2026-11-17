/** Blank records for the "new" forms. Plain module so server pages can call it. */
import type { Product } from "@/data/products";
import type { CustomTemplate, Side, TemplateView } from "@/data/schema";

export function newProduct(categoryId: string): Product {
  return {
    slug: "",
    categoryId,
    active: false,
    name: "",
    shortName: "",
    world: "nightshift",
    price: 0,
    colorName: "",
    colorHex: "#111111",
    tagline: "",
    description: "",
    story: "",
    details: [],
    fit: "",
    sizes: ["S", "M", "L", "XL"],
    soldOut: [],
    images: [
      { kind: "front", alt: "" },
      { kind: "back", alt: "" },
    ],
    rank: 99,
    addedAt: new Date().toISOString().slice(0, 10),
  };
}

export function newTemplate(categoryId: string): CustomTemplate {
  const view = (side: Side): TemplateView => ({
    side,
    enabled: true,
    mockup: `/customizer/hoodie-white-${side}.webp`,
    mockupW: 1000,
    mockupH: 1150,
    area: side === "front" ? { x: 0.34, y: 0.3, w: 0.32, h: 0.26 } : { x: 0.3, y: 0.3, w: 0.4, h: 0.44 },
    printWidthCm: side === "front" ? 26 : 33,
    printPrice: 0,
  });
  return {
    id: "",
    name: "",
    categoryId,
    basePrice: 0,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ id: "white", name: "White", hex: "#f2f2f0" }],
    views: [view("front"), view("back")],
    tint: true,
    active: false,
    order: 1,
  };
}
