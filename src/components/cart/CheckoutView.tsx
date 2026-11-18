"use client";

import { useState, useTransition } from "react";
import { useCart, useHydrated } from "@/lib/store";
import { cartTotals } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog";
import { formatPrice } from "@/config/brand";
import { checkDiscount, placeOrder, type DiscountCheck } from "@/server/placeOrder";
import { PAYMENT_LABEL, PAYMENT_METHODS, type PaymentMethod } from "@/data/schema";
import { TransitionLink } from "@/components/transition/TransitionLink";
import styles from "./Checkout.module.css";

/**
 * CHECKOUT. Payment methods, delivery zones and discount codes all come from
 * the dashboard (Payments, Shipping, Discounts). The order is created and
 * re-priced server-side (src/server/placeOrder.ts) and appears in /admin/orders.
 */
export function CheckoutView() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const catalog = useCatalog();
  const { shippingZones: zones, payments } = catalog.settings;
  const methods = PAYMENT_METHODS.filter((m) => payments?.[m]?.enabled);
  const [zoneId, setZoneId] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>(methods[0] ?? "cod");
  const { resolved, subtotal, count, shipping: baseShipping } = cartTotals(hydrated ? lines : [], catalog, zoneId);
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<DiscountCheck | null>(null);
  const [checking, startCheck] = useTransition();
  const applied = promo?.ok ? promo : null;
  const shipping = applied?.freeShipping ? 0 : baseShipping;
  const off = applied && !applied.freeShipping ? Math.min(subtotal, applied.amount) : 0;
  const total = subtotal - off + shipping;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ number: string; payment: PaymentMethod; total: number } | null>(null);

  const apply = () => {
    if (!code.trim()) return;
    startCheck(async () => setPromo(await checkDiscount(code, subtotal, baseShipping)));
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const customer = Object.fromEntries(["name", "phone", "email", "city", "address", "notes"].map((k) => [k, String(f.get(k) ?? "")]));
    setError(null);
    start(async () => {
      const res = await placeOrder({ customer, lines, zoneId: zoneId || undefined, payment, discountCode: applied?.code });
      if (res.ok) {
        setDone({ number: res.number, payment, total });
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
            <p className="mono">Order {done.number}</p>
            <h1 className="display">
              It&apos;s <em className="serif">yours.</em>
            </h1>
            <p className={styles.lead}>
              We got your order. We&apos;ll call you to confirm before it ships.{" "}
              {done.payment === "cod"
                ? "You pay in cash when it arrives."
                : `Send ${formatPrice(done.total)} by ${PAYMENT_LABEL[done.payment].toLowerCase()} and put your order number in the transfer note.`}{" "}
              Keep your order number: <strong>{done.number}</strong>.
            </p>
            {done.payment !== "cod" && payments?.[done.payment]?.details && (
              <p className={styles.pay} style={{ whiteSpace: "pre-line", marginBottom: 30 }}>
                {payments[done.payment].details}
              </p>
            )}
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
              {zones?.length > 0 && (
                <label>
                  <span className="mono">Delivery area</span>
                  <select name="zone" required value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                    <option value="" disabled>
                      Choose…
                    </option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} · {z.fee ? formatPrice(z.fee) : "Free"}
                        {z.days ? ` · ${z.days}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                <span className="mono">{zones?.length ? "City / district" : "City"}</span>
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

            <fieldset disabled={pending || empty}>
              <legend className="mono">03 · Payment</legend>
              {methods.length <= 1 ? (
                <p className={styles.pay} style={{ whiteSpace: "pre-line" }}>
                  <span aria-hidden="true">✳</span>{" "}
                  {payment === "cod" ? "Cash on delivery. Pay when your order arrives." : `${PAYMENT_LABEL[payment]}. ${payments[payment].details}`}
                </p>
              ) : (
                <div className={styles.methods}>
                  {methods.map((m) => (
                    <label key={m} className={styles.method}>
                      <input type="radio" name="payment" value={m} checked={payment === m} onChange={() => setPayment(m)} />
                      <span>
                        <strong>{PAYMENT_LABEL[m]}</strong>
                        <small>{m === "cod" ? "Pay when your order arrives." : payments[m].details}</small>
                      </span>
                    </label>
                  ))}
                </div>
              )}
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
          {off > 0 && (
            <div className={styles.sub}>
              <span className="mono">Discount · {applied!.code}</span>
              <span>−{formatPrice(off)}</span>
            </div>
          )}
          <div className={styles.sub}>
            <span className="mono">Shipping</span>
            <span>{zones?.length && !zoneId && !applied?.freeShipping && subtotal > 0 ? "Choose area" : shipping === 0 ? "Free" : formatPrice(shipping)}</span>
          </div>
          <div className={styles.promo}>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setPromo(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply();
                }
              }}
              placeholder="Discount code"
              aria-label="Discount code"
              autoComplete="off"
              disabled={!!applied}
            />
            {applied ? (
              <button
                type="button"
                className="mono"
                onClick={() => {
                  setPromo(null);
                  setCode("");
                }}
              >
                Remove
              </button>
            ) : (
              <button type="button" className="mono" onClick={apply} disabled={checking || !code.trim() || empty}>
                {checking ? "…" : "Apply"}
              </button>
            )}
          </div>
          {promo && (
            <p className={styles.promoNote} role="status">
              {promo.ok ? `✳ ${promo.label} applied` : promo.error}
            </p>
          )}
          <div className={styles.total}>
            <span className="mono">Total</span>
            <span className="display">{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
