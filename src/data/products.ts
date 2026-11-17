/**
 * PRODUCT CATALOG
 *
 * Images live in /public/products/<slug>/ and were extracted from the brand's
 * reference mockups:
 *   - `src`     studio image of the garment (on its original backdrop)
 *   - `cutout`  the same garment with the backdrop removed (transparent WebP),
 *               used wherever the site stages the hoodie on its own surfaces
 * An image may be tied to a back-print `variant`. Slots with no image
 * (e.g. model/campaign photography) fall back to a staged cut-out that is
 * clearly labelled as pending. See /public/products/README.md.
 */

export type World = "daydream" | "nightshift";
export const WORLD_IDS: World[] = ["daydream", "nightshift"];
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type ImageKind = "front" | "back" | "detail-front" | "detail-back" | "model" | "campaign";

export type ProductImage = {
  kind: ImageKind;
  alt: string;
  src?: string;
  cutout?: string;
  variant?: string;
};

export type PrintVariant = {
  id: string;
  label: string;
  note: string;
};

export type Product = {
  slug: string;
  /** category id (see Category in schema.ts) */
  categoryId: string;
  /** hidden from the store when false */
  active: boolean;
  name: string;
  shortName: string;
  world: World;
  price: number; // PLACEHOLDER pricing
  colorName: string;
  colorHex: string;
  tagline: string;
  description: string;
  story: string;
  details: string[];
  fit: string;
  sizes: Size[];
  soldOut: Size[];
  printVariants?: PrintVariant[];
  images: ProductImage[];
  badge?: string;
  rank: number; // best-seller order
  addedAt: string; // ISO date, used by "newest" sort
};

export const WORLDS: Record<World, { label: string; index: string; blurb: string }> = {
  daydream: {
    index: "01",
    label: "Daydream",
    blurb: "Crayon logic. Margin doodles. The kid who drew on everything grew up and kept going.",
  },
  nightshift: {
    index: "02",
    label: "Nightshift",
    blurb: "One eye open after midnight. Electric blue on black: what you see when the city stops performing.",
  },
};

export const SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

const REX = "/products/rex-doodle-hoodie";
const EYE = "/products/third-eye-hoodie";

/** First-run seed. After that the catalog lives in the data store and is edited from /admin. */
export const SEED_PRODUCTS: Product[] = [
  {
    slug: "rex-doodle-hoodie",
    categoryId: "hoodies",
    active: true,
    name: "ROARR Rex Hoodie",
    shortName: "ROARR Rex",
    world: "daydream",
    price: 95,
    colorName: "Heather Grey",
    colorHex: "#a9a9a9",
    tagline: "A tiny ROARR on the chest. The whole T-rex on the back.",
    description:
      "Oversized heather-grey hoodie. The front carries a small ROARR chest graphic. The back is the full piece: a teal T-rex in shades and checkered sneakers gripping a skateboard under orange ROARR lettering, surrounded by hand-written notes like “Wild one”, “Scary face”, “Super cool” and “Hey dude”.",
    story: "Drawn like the back page of a school notebook. Arrows, lightning bolts, side notes, and one dinosaur that refuses to sit still.",
    details: [
      "Oversized fit with dropped shoulders",
      "Small ROARR graphic on the chest",
      "Full-back T-rex illustration with hand-lettered notes",
      "Drawcords with metal tips",
      "Kangaroo pocket",
      "Ribbed cuffs and hem",
    ],
    fit: "Cut oversized. Take your usual size for the intended slouch, or size down for a closer fit.",
    sizes: SIZES,
    soldOut: ["XS"],
    images: [
      { kind: "front", alt: "ROARR Rex Hoodie in heather grey, front view with small chest graphic", src: `${REX}/front.webp`, cutout: `${REX}/front-cut.webp` },
      { kind: "back", alt: "ROARR Rex Hoodie, back view with the skateboarding T-rex print", src: `${REX}/back.webp`, cutout: `${REX}/back-cut.webp` },
      { kind: "detail-back", alt: "Close-up of the T-rex back print and hand-written notes", src: `${REX}/detail-back.webp` },
      { kind: "detail-front", alt: "Close-up of the small ROARR chest graphic", src: `${REX}/detail-front.webp` },
      { kind: "model", alt: "ROARR Rex Hoodie lookbook" },
    ],
    badge: "Drop 01",
    rank: 1,
    addedAt: "2026-10-01",
  },
  {
    slug: "third-eye-hoodie",
    categoryId: "hoodies",
    active: true,
    name: "Third Eye Hoodie",
    shortName: "Third Eye",
    world: "nightshift",
    price: 110,
    colorName: "Black",
    colorHex: "#0d0d0f",
    tagline: "One small eye on the chest. Your choice of vision on the back.",
    description:
      "Oversized black hoodie with a small electric-blue eye sigil on the chest (about 6 cm) and a 40 × 40 cm back print in glowing blue. Choose from four back designs: Main Design, Eyes Focus, Silhouette Energy or Minimal Symbol.",
    story: "Made for the hours after the last train. The front gives almost nothing away. Turn around and the blue starts talking.",
    details: [
      "Oversized fit with dropped shoulders",
      "Eye sigil chest logo, approx. 6 cm",
      "Back print 40 × 40 cm",
      "Four back designs to choose from",
      "Drawcords with metal tips",
      "Kangaroo pocket, ribbed cuffs and hem",
    ],
    fit: "Cut oversized. Take your usual size for the intended slouch, or size down for a closer fit.",
    sizes: SIZES,
    soldOut: [],
    printVariants: [
      { id: "main-design", label: "Main Design", note: "01" },
      { id: "eyes-focus", label: "Eyes Focus", note: "02" },
      { id: "silhouette-energy", label: "Silhouette Energy", note: "03" },
      { id: "minimal-symbol", label: "Minimal Symbol", note: "04" },
    ],
    images: [
      { kind: "front", alt: "Third Eye Hoodie in black, front view with blue eye chest logo", src: `${EYE}/front.webp`, cutout: `${EYE}/front-cut.webp` },
      { kind: "back", variant: "main-design", alt: "Third Eye Hoodie, back print 01: Main Design", src: `${EYE}/back-main-design.webp`, cutout: `${EYE}/back-main-design-cut.webp` },
      { kind: "back", variant: "eyes-focus", alt: "Third Eye Hoodie, back print 02: Eyes Focus", src: `${EYE}/back-eyes-focus.webp`, cutout: `${EYE}/back-eyes-focus-cut.webp` },
      { kind: "back", variant: "silhouette-energy", alt: "Third Eye Hoodie, back print 03: Silhouette Energy", src: `${EYE}/back-silhouette-energy.webp`, cutout: `${EYE}/back-silhouette-energy-cut.webp` },
      { kind: "back", variant: "minimal-symbol", alt: "Third Eye Hoodie, back print 04: Minimal Symbol", src: `${EYE}/back-minimal-symbol.webp`, cutout: `${EYE}/back-minimal-symbol-cut.webp` },
      { kind: "detail-front", alt: "Close-up of the eye sigil chest logo", src: `${EYE}/detail-front.webp` },
      { kind: "detail-back", variant: "main-design", alt: "Main Design back print, 40 × 40 cm", src: `${EYE}/detail-back-main-design.webp` },
      { kind: "model", alt: "Third Eye Hoodie lookbook" },
    ],
    badge: "Most wanted",
    rank: 2,
    addedAt: "2026-10-20",
  },
];

/**
 * Best image for a slot. Variant-specific images win; a missing variant
 * detail falls back to that variant's back view so the print shown always
 * matches the selection.
 */
export function getImage(product: Product, kind: ImageKind, variant?: string): ProductImage {
  const v = variant ?? product.printVariants?.[0]?.id;
  const of = (k: ImageKind) => product.images.filter((i) => i.kind === k);
  const pick = (k: ImageKind) => {
    const list = of(k);
    return list.find((i) => i.variant && i.variant === v) ?? list.find((i) => !i.variant && (i.src || i.cutout)) ?? (v ? undefined : list[0]);
  };
  if (kind === "detail-back") return pick("detail-back") ?? pick("back") ?? product.images[0];
  return pick(kind) ?? of(kind)[0] ?? product.images[0];
}

/** Transparent garment for staged layouts. */
export function getCutout(product: Product, view: "front" | "back", variant?: string) {
  return getImage(product, view, variant).cutout;
}

/** The flagship product for a world, falling back to anything available. */
export function byWorld(products: Product[], w: World): Product | undefined {
  return products.find((p) => p.world === w) ?? products[0];
}
