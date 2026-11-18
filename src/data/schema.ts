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
  /** Size guide shown on this category's product pages. */
  sizeChart?: SizeChart;
};

/**
 * Garment measurements: one row per measurement, one value per size.
 * Values are text so ranges like "60-62" work; plain numbers in cm are
 * converted when the shopper switches to inches.
 */
export type SizeChart = {
  intro: string;
  sizes: string[];
  rows: { label: string; values: string[] }[];
};

export const DEFAULT_SIZE_CHART: SizeChart = {
  intro: "Cut oversized with dropped shoulders. Take your usual size for the intended slouch, or size down for a closer fit.",
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  rows: [
    { label: "Chest (flat)", values: ["60", "63", "66", "69", "72", "75"] },
    { label: "Body length", values: ["68", "70", "72", "74", "76", "78"] },
    { label: "Sleeve", values: ["84", "86", "88", "90", "92", "94"] },
  ],
};

/* ------------------------------------------------------------------ */
/* Customizer                                                        */
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
  payment: PaymentMethod;
  /** Discount code used at checkout. `amount` is already taken off `total`. */
  discount?: { code: string; amount: number };
  /** Tracked stock was put back when the order was cancelled. */
  restocked?: boolean;
  adminNote?: string;
  history: { at: string; status: OrderStatus }[];
};

/** Everything about the brand the owner can change from Settings. */
export type BrandInfo = {
  name: string;
  tagline: string;
  description: string;
  /** Live site address, e.g. https://dravx.com (used for SEO links). */
  siteUrl: string;
  /** ISO code, e.g. USD or EGP */
  currency: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  shippingInfo: string;
  returnsInfo: string;
};

export const DEFAULT_BRAND: BrandInfo = {
  name: "DRAVX",
  tagline: "Turn your back on them.",
  description: "DRAVX makes oversized hoodies with a quiet front and a loud back. Two worlds, one hood: DAYDREAM and NIGHTSHIFT.",
  siteUrl: "https://dravx.example",
  currency: "USD",
  email: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  tiktok: "",
  facebook: "",
  shippingInfo: "We call to confirm every order before it ships. Pay in cash when it arrives.",
  returnsInfo: "",
};

/* ------------------------------------------------------------------ */
/* Shipping, payments, discounts, integrations                         */
/* ------------------------------------------------------------------ */

/** A delivery area with its own fee (e.g. a governorate). */
export type ShippingZone = { id: string; name: string; fee: number; days?: string };

export const PAYMENT_METHODS = ["cod", "instapay", "wallet"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  instapay: "InstaPay / bank transfer",
  wallet: "Mobile wallet",
};
/** Public: shown at checkout. `details` is what the customer needs to pay (account, number…). */
export type PaymentOption = { enabled: boolean; details: string };
export type PaymentSettings = Record<PaymentMethod, PaymentOption>;
export const DEFAULT_PAYMENTS: PaymentSettings = {
  cod: { enabled: true, details: "" },
  instapay: { enabled: false, details: "" },
  wallet: { enabled: false, details: "" },
};

export type Settings = {
  /** Fee when no zones are set, or for zones without their own fee. */
  shippingFee: number;
  freeShippingThreshold: number;
  /** When set, checkout asks the customer to pick one and charges its fee. */
  shippingZones: ShippingZone[];
  payments: PaymentSettings;
  customizerEnabled: boolean;
  brand: BrandInfo;
};

export function shippingFor(s: Pick<Settings, "shippingFee" | "freeShippingThreshold" | "shippingZones">, subtotal: number, zoneId?: string) {
  if (subtotal <= 0) return 0;
  if (s.freeShippingThreshold > 0 && subtotal >= s.freeShippingThreshold) return 0;
  const zone = s.shippingZones?.find((z) => z.id === zoneId);
  return zone ? zone.fee : s.shippingFee;
}

/** Server-only. Never part of the public catalog. */
export type Discount = {
  code: string; // upper-case, unique
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotal: number;
  /** 0 = unlimited */
  maxUses: number;
  uses: number;
  /** ISO date (inclusive) or empty */
  expiresAt?: string;
  active: boolean;
  createdAt: string;
};

/** What a discount takes off an order. */
export function discountAmount(d: Discount, subtotal: number, shipping: number): number {
  if (d.type === "percent") return Math.round(subtotal * Math.min(100, d.value)) / 100;
  if (d.type === "fixed") return Math.min(subtotal, d.value);
  return shipping;
}

/** Why a code can't be used right now, or null if it can. */
export function discountProblem(d: Discount | undefined, subtotal: number, now = new Date()): string | null {
  if (!d || !d.active) return "That code isn't valid.";
  if (d.expiresAt && now.toISOString().slice(0, 10) > d.expiresAt) return "That code has expired.";
  if (d.maxUses > 0 && d.uses >= d.maxUses) return "That code has been fully used.";
  if (subtotal < d.minSubtotal) return "MIN";
  return null;
}

/** Saved credentials for a shipping company or payment gateway. Server-only. */
export type IntegrationState = {
  enabled: boolean;
  fields: Record<string, string>;
  updatedAt: string;
};

/** Dashboard notification (new orders and the like). */
export type Notice = {
  id: string;
  at: string;
  kind: "order" | "custom-order";
  title: string;
  body: string;
  href: string;
  read: boolean;
};

export type DB = {
  version: 1;
  seq: number;
  settings: Settings;
  categories: Category[];
  products: Product[];
  templates: CustomTemplate[];
  orders: Order[];
  notifications: Notice[];
  discounts: Discount[];
  integrations: Record<string, IntegrationState>;
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
