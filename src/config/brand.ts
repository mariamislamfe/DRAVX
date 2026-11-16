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
  freeShippingThreshold: 150, // PLACEHOLDER — in currency units
  /**
   * Checkout is NOT connected to a payment provider.
   * Flip to true only once a real provider (Shopify, Stripe…) is wired in /app/checkout.
   */
  paymentsLive: false,
} as const;

export function formatPrice(amount: number) {
  return new Intl.NumberFormat(BRAND.locale, {
    style: "currency",
    currency: BRAND.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
