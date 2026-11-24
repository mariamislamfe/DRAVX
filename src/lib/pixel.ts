/**
 * Meta Pixel events. The pixel is only loaded on the storefront when the
 * owner adds at least one Pixel ID (Dashboard → Settings); until then these
 * calls do nothing.
 */
type Fbq = (...args: unknown[]) => void;

export function track(event: "AddToCart" | "InitiateCheckout" | "Purchase" | "PageView", params?: Record<string, unknown>, eventID?: string) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (!fbq) return;
  if (eventID) fbq("track", event, params ?? {}, { eventID });
  else if (params) fbq("track", event, params);
  else fbq("track", event);
}
