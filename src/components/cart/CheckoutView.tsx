"use client";

import { useCart, useHydrated } from "@/lib/store";
import { cartTotals } from "@/lib/cart";
import { BRAND, formatPrice } from "@/config/brand";
import { TransitionLink } from "@/components/transition/TransitionLink";
import styles from "./Checkout.module.css";

/**
 * CHECKOUT — INTEGRATION POINT
 * No payment provider is connected. Nothing here charges a card or creates
 * an order. To go live, hand the cart lines to a provider here (e.g. a
 * Shopify Storefront cart → checkoutUrl, or a Stripe Checkout Session
 * created in a server action) and set BRAND.paymentsLive = true.
 */
export function CheckoutView() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const { resolved, subtotal, count } = cartTotals(hydrated ? lines : []);

  return (
    <div className={`${styles.page} on-paper`}>
      <div className={`${styles.inner} wrap`}>
        <div>
          <p className="mono">Checkout</p>
          <h1 className="display">
            Almost <em className="serif">yours.</em>
          </h1>

          {!BRAND.paymentsLive && (
            <div className={styles.notice} role="note">
              <p className="mono">Payments not connected</p>
              <p>
                This store doesn&apos;t have a payment provider yet, so no order will be placed and nothing will be charged. Your bag is saved
                on this device.
              </p>
            </div>
          )}

          <ol className={styles.steps}>
            <li>
              <span className="mono">01</span> Contact & delivery
            </li>
            <li>
              <span className="mono">02</span> Shipping method
            </li>
            <li>
              <span className="mono">03</span> Payment
            </li>
          </ol>

          <button type="button" className="btn btn--ink" disabled aria-disabled="true">
            Pay {hydrated ? formatPrice(subtotal) : ""} (unavailable)
          </button>
          <p className={styles.back}>
            <TransitionLink href="/cart" className="mono link-u">
              ← Back to bag
            </TransitionLink>
          </p>
        </div>

        <aside className={styles.summary} aria-label="Order summary">
          <p className="mono">Order summary ({count})</p>
          {hydrated && resolved.length === 0 && <p>Your bag is empty.</p>}
          <ul>
            {resolved.map((l) => (
              <li key={l.key}>
                <span>
                  {l.product.name}
                  <small className="mono">
                    Size {l.size}
                    {l.variant ? ` · ${l.product.printVariants?.find((v) => v.id === l.variant)?.label}` : ""} × {l.qty}
                  </small>
                </span>
                <span>{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.total}>
            <span className="mono">Subtotal</span>
            <span className="display">{formatPrice(subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
