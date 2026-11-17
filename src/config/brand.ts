/**
 * BRAND CONFIG — every business placeholder lives here.
 * Values marked PLACEHOLDER must be confirmed before launch.
 */
export const BRAND = {
  name: "DRAVX",
  tagline: "Turn your back on them.",
  description:
    "DRAVX makes oversized hoodies with a quiet front and a loud back. Two worlds, one hood: DAYDREAM and NIGHTSHIFT.",
  url: "https://dravx.example", // PLACEHOLDER — production domain
  email: "studio@dravx.example", // PLACEHOLDER
  instagram: "@dravx.studio", // PLACEHOLDER
  currency: "USD", // PLACEHOLDER — store currency
  locale: "en-US",
  // shipping fee, free-shipping threshold and the customizer switch live in /admin/settings
} as const;

export function formatPrice(amount: number) {
  return new Intl.NumberFormat(BRAND.locale, {
    style: "currency",
    currency: BRAND.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
