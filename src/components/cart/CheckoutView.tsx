"use client";

import { useState, useTransition } from "react";
import { useCart, useHydrated } from "@/lib/store";
import { cartTotals } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog";
import { formatPrice } from "@/config/brand";
import { placeOrder } from "@/server/placeOrder";
import { TransitionLink } from "@/components/transition/TransitionLink";
import styles from "./Checkout.module.css";

/**
 * CHECKOUT: cash on delivery.
 * The order is created server-side (src/server/placeOrder.ts) and appears in
 * /admin/orders. To add card payments later, create the provider session in
 * placeOrder and redirect to it instead of showing the confirmation.
 */
export function CheckoutView() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const { resolved, subtotal, count, shipping, total } = cartTotals(hydrated ? lines : [], useCatalog());
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const customer = Object.fromEntries(["name", "phone", "email", "city", "address", "notes"].map((k) => [k, String(f.get(k) ?? "")]));
    setError(null);
    start(async () => {
      const res = await placeOrder({ customer, lines });
      if (res.ok) {
        setDone(res.number);
        clear();
        window.scrollTo({ top: 0 });
      } else setError(res.error);
    });
  };

  if (done) {
    return (
      <div className={`${styles.page} on-paper`}>
        <div className={`${styles.inner} wrap`}>
          <div role="status">
            <p className="mono">Order {done}</p>
            <h1 className="display">
              It&apos;s <em className="serif">yours.</em>
            </h1>
            <p className={styles.lead}>
              We got your order. We&apos;ll call you to confirm before it ships. You pay in cash when it arrives. Keep your order number:{" "}
              <strong>{done}</strong>.
            </p>
            <TransitionLink href="/shop" className="btn btn--ink">
              Keep shopping →
            </TransitionLink>
          </div>
        </div>
      </div>
    );
  }

  const empty = hydrated && resolved.length === 0;

  return (
    <div className={`${styles.page} on-paper`}>
      <div className={`${styles.inner} wrap`}>
        <div>
          <p className="mono">Checkout</p>
          <h1 className="display">
            Almost <em className="serif">yours.</em>
          </h1>

          <form className={styles.form} onSubmit={submit} noValidate={false}>
            <fieldset disabled={pending || empty}>
              <legend className="mono">01 · Contact</legend>
              <label>
                <span className="mono">Full name</span>
                <input name="name" required minLength={2} autoComplete="name" />
              </label>
              <div className={styles.row}>
                <label>
                  <span className="mono">Phone</span>
                  <input name="phone" required type="tel" autoComplete="tel" inputMode="tel" pattern="\+?[\d\s\(\)\-]{7,}" />
                </label>
                <label>
                  <span className="mono">Email (optional)</span>
                  <input name="email" type="email" autoComplete="email" />
                </label>
              </div>
            </fieldset>

            <fieldset disabled={pending || empty}>
              <legend className="mono">02 · Delivery</legend>
              <label>
                <span className="mono">City</span>
                <input name="city" required autoComplete="address-level2" />
              </label>
              <label>
                <span className="mono">Address</span>
                <textarea name="address" required minLength={6} rows={3} autoComplete="street-address" />
              </label>
              <label>
                <span className="mono">Notes (optional)</span>
                <textarea name="notes" rows={2} />
              </label>
            </fieldset>

            <fieldset disabled>
              <legend className="mono">03 · Payment</legend>
              <p className={styles.pay}>
                <span aria-hidden="true">✳</span> Cash on delivery. Pay when your order arrives.
              </p>
            </fieldset>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn--ink" disabled={pending || !hydrated || empty}>
              {pending ? "Placing order…" : `Place order · ${hydrated ? formatPrice(total) : ""}`}
            </button>
          </form>

          <p className={styles.back}>
            <TransitionLink href="/cart" className="mono link-u">
              ← Back to bag
            </TransitionLink>
          </p>
        </div>

        <aside className={styles.summary} aria-label="Order summary">
          <p className="mono">Order summary ({count})</p>
          {empty && <p>Your bag is empty.</p>}
          <ul>
            {resolved.map((l) => (
              <li key={l.key}>
                <span>
                  {l.name}
                  <small className="mono">
                    {l.meta} × {l.qty}
                  </small>
                </span>
                <span>{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.sub}>
            <span className="mono">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className={styles.sub}>
            <span className="mono">Shipping</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
          </div>
          <div className={styles.total}>
            <span className="mono">Total</span>
            <span className="display">{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
