/**
 * Static brand fallbacks. Everything editable (name, contact, socials,
 * currency, shipping copy) lives in Dashboard → Settings → Brand and reaches
 * pages through the catalog (useCatalog().settings.brand) or readDB().
 */
import { DEFAULT_BRAND } from "@/data/schema";

export const BRAND = {
  name: DEFAULT_BRAND.name,
  description: DEFAULT_BRAND.description,
  url: DEFAULT_BRAND.siteUrl,
  locale: "en-US",
} as const;

/*
 * Store currency. Set from Settings on every server read (readDB) and in the
 * browser by <CatalogProvider>, so formatPrice can stay a plain function.
 * One store per deployment, so a module-level value is safe.
 */
let currency = DEFAULT_BRAND.currency;
const formatters = new Map<string, Intl.NumberFormat>();

export function setCurrency(code: string | undefined) {
  if (code && /^[A-Z]{3}$/.test(code)) currency = code;
}

export function formatPrice(amount: number) {
  let f = formatters.get(currency);
  if (!f) {
    try {
      f = new Intl.NumberFormat(BRAND.locale, { style: "currency", currency, maximumFractionDigits: 0 });
    } catch {
      f = new Intl.NumberFormat(BRAND.locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    }
    formatters.set(currency, f);
  }
  return f.format(amount);
}

/** Turn "@handle", "handle" or a full URL into a link for that network. */
export function socialUrl(network: "instagram" | "tiktok" | "facebook", value: string) {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  return { instagram: `https://instagram.com/${handle}`, tiktok: `https://tiktok.com/@${handle}`, facebook: `https://facebook.com/${handle}` }[network];
}

/** wa.me link from a phone number in any format. */
export const whatsappUrl = (phone: string) => (phone.replace(/\D/g, "") ? `https://wa.me/${phone.replace(/\D/g, "")}` : "");
