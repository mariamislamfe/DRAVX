/**
 * Shapes for everything the dashboard manages. The store reads these from the
 * data store (src/server/db.ts); the browser only ever sees the public parts.
 */
import type { Product, Size } from "./products";

export type Category = {
  id: string; // stable id, also used in URLs (?cat=)
  name: string;
  description?: string;
  order: number;
  active: boolean;
};

/* ------------------------------------------------------------------ */
/* Customizer                                                          */
/* ------------------------------------------------------------------ */

export type Side = "front" | "back";

/** Print area as fractions (0–1) of the mockup image. */
export type PrintRect = { x: number; y: number; w: number; h: number };

export type TemplateView = {
  side: Side;
  enabled: boolean;
  /** Mockup photo/render of the blank garment. Light/white garments tint best. */
  mockup: string;
  /** Natural size of the mockup, so the print area keeps its real proportions. */
  mockupW: number;
  mockupH: number;
  area: PrintRect;
  /** Physical width of the print area. Height follows the area's proportions. */
  printWidthCm: number;
  /** Added to the base price when this side carries a design. */
  printPrice: number;
};

export type TemplateColor = {
  id: string;
  name: string;
  hex: string;
  /**
   * Real photo of the blank garment in this colour, per side. Same framing as
   * the side's mockup. When set it's shown as-is; otherwise the side's mockup
   * is tinted with `hex`.
   */
  photos?: Partial<Record<Side, string>>;
};

/** Which image to draw for a side in a colour, and whether to tint it. */
export function mockupFor(view: TemplateView, color: TemplateColor | undefined, tint: boolean): { src: string; tint: string | null } {
  const photo = color?.photos?.[view.side];
  if (photo) return { src: photo, tint: null };
  return { src: view.mockup, tint: tint && color ? color.hex : null };
}

export type CustomTemplate = {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  basePrice: number;
  sizes: Size[];
  colors: TemplateColor[];
  views: TemplateView[];
  /** Tint the mockup with the chosen colour (needs a light/white mockup). */
  tint: boolean;
  active: boolean;
  order: number;
};

/** One printed side of a customer's design, as stored on the cart line / order. */
export type CustomSide = {
  side: Side;
  /** Print-ready transparent PNG of the whole print area. */
  designUrl: string;
  /** Design composited on the garment. */
  mockupUrl: string;
  /** Print area size. */
  areaWidthCm: number;
  areaHeightCm: number;
  /** Bounding box of the actual artwork inside the print area (cm). */
  artWidthCm: number;
  artHeightCm: number;
  artTopCm: number; // from the top edge of the print area
  artLeftCm: number; // from the left edge of the print area
  dpi: number;
  layers: { type: "image" | "text"; label: string }[];
};

export type CustomDesign = {
  templateId: string;
  templateName: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  sides: CustomSide[];
  /** Files exactly as the customer uploaded them. */
  originals: string[];
  note?: string;
};

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export const ORDER_STATUSES = ["pending", "confirmed", "in_production", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "New",
  confirmed: "Confirmed",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type OrderItem = {
  kind: "product" | "custom";
  slug?: string; // product items
  name: string;
  size: Size;
  variant?: string;
  variantLabel?: string;
  colorName?: string;
  qty: number;
  unitPrice: number;
  image?: string;
  custom?: CustomDesign;
};

export type Customer = {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
};

export type Order = {
  id: string;
  number: string; // human readable, e.g. DRX-1004
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment: "cod";
  adminNote?: string;
  history: { at: string; status: OrderStatus }[];
};

export type Settings = {
  shippingFee: number;
  freeShippingThreshold: number;
  customizerEnabled: boolean;
};

export type DB = {
  version: 1;
  seq: number;
  settings: Settings;
  categories: Category[];
  products: Product[];
  templates: CustomTemplate[];
  orders: Order[];
};

/** What the storefront receives. */
export type Catalog = {
  products: Product[];
  categories: Category[];
  templates: CustomTemplate[];
  settings: Settings;
};

export function templatePrice(t: CustomTemplate, sides: Side[]) {
  return t.basePrice + t.views.filter((v) => sides.includes(v.side)).reduce((s, v) => s + v.printPrice, 0);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}
