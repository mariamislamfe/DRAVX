"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useCart, useHydrated } from "@/lib/store";
import { cartTotals } from "@/lib/cart";
import { useCatalog, useText } from "@/lib/catalog";
import { Rich } from "@/components/brand/Rich";
import { track } from "@/lib/pixel";
import { formatPrice } from "@/config/brand";
import { checkDiscount, placeOrder, type DiscountCheck } from "@/server/placeOrder";
import { PAYMENT_METHODS, type PaymentMethod } from "@/data/schema";
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
  const t = useText();
  const PAYMENT_LABEL = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, t(`pay.${m}`)])) as Record<PaymentMethod, string>;
  const currency = catalog.settings.brand.currency;
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

  // Meta Pixel: once per visit to checkout, when the bag has something in it
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !hydrated || !resolved.length) return;
    started.current = true;
    track("InitiateCheckout", { value: subtotal, currency, num_items: count, content_ids: resolved.map((l) => l.slug).filter(Boolean) });
  }, [hydrated, resolved, subtotal, currency, count]);

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
        track("Purchase", { value: total, currency, num_items: count, content_ids: resolved.map((l) => l.slug).filter(Boolean), content_type: "product" }, res.number);
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
            <p className="mono">{t("co.doneOrder", { number: done.number })}</p>
            <h1 className="display">
              <Rich text={t("co.doneTitle")} />
            </h1>
            <p className={styles.lead}>
              {t("co.doneLead")}{" "}
              {done.payment === "cod"
                ? t("co.donePayCod")
                : t("co.donePayOther", { total: formatPrice(done.total), method: PAYMENT_LABEL[done.payment].toLowerCase() })}{" "}
              {t("co.doneKeep")} <strong>{done.number}</strong>.
            </p>
            {done.payment !== "cod" && payments?.[done.payment]?.details && (
              <p className={styles.pay} style={{ whiteSpace: "pre-line", marginBottom: 30 }}>
                {payments[done.payment].details}
              </p>
            )}
            <TransitionLink href="/shop" className="btn btn--ink">
              {t("co.doneShop")}
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
          <h1 className="sr-only">Checkout</h1>

          <form className={styles.form} onSubmit={submit} noValidate={false}>
            <fieldset disabled={pending || empty}>
              <legend className="mono">{t("co.contact")}</legend>
              <label>
                <span className="mono">{t("co.name")}</span>
                <input name="name" required minLength={2} autoComplete="name" />
              </label>
              <div className={styles.row}>
                <label>
                  <span className="mono">{t("co.phone")}</span>
                  <input name="phone" required type="tel" autoComplete="tel" inputMode="tel" pattern="\+?[\d\s\(\)\-]{7,}" />
                </label>
                <label>
                  <span className="mono">{t("co.email")}</span>
                  <input name="email" type="email" autoComplete="email" />
                </label>
              </div>
            </fieldset>

            <fieldset disabled={pending || empty}>
              <legend className="mono">{t("co.delivery")}</legend>
              {zones?.length > 0 && (
                <label>
                  <span className="mono">{t("co.area")}</span>
                  <select name="zone" required value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                    <option value="" disabled>
                      {t("co.choose")}
                    </option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} · {z.fee ? formatPrice(z.fee) : t("co.free")}
                        {z.days ? ` · ${z.days}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                <span className="mono">{zones?.length ? t("co.cityDistrict") : t("co.city")}</span>
                <input name="city" required autoComplete="address-level2" />
              </label>
              <label>
                <span className="mono">{t("co.address")}</span>
                <textarea name="address" required minLength={6} rows={3} autoComplete="street-address" />
              </label>
              <label>
                <span className="mono">{t("co.notes")}</span>
                <textarea name="notes" rows={2} />
              </label>
            </fieldset>

            <fieldset disabled={pending || empty}>
              <legend className="mono">{t("co.payment")}</legend>
              {methods.length <= 1 ? (
                <p className={styles.pay} style={{ whiteSpace: "pre-line" }}>
                  <span aria-hidden="true">✳</span>{" "}
                  {payment === "cod" ? t("co.codLine") : `${PAYMENT_LABEL[payment]}. ${payments[payment].details}`}
                </p>
              ) : (
                <div className={styles.methods}>
                  {methods.map((m) => (
                    <label key={m} className={styles.method}>
                      <input type="radio" name="payment" value={m} checked={payment === m} onChange={() => setPayment(m)} />
                      <span>
                        <strong>{PAYMENT_LABEL[m]}</strong>
                        <small>{m === "cod" ? t("co.codShort") : payments[m].details}</small>
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
              {pending ? t("co.placing") : t("co.place", { price: hydrated ? formatPrice(total) : "" })}
            </button>
          </form>

          <p className={styles.back}>
            <TransitionLink href="/cart" className="mono link-u">
              {t("co.back")}
            </TransitionLink>
          </p>
        </div>

        <aside className={styles.summary} aria-label="Order summary">
          <p className="mono">{t("co.summary", { n: count })}</p>
          {empty && <p>{t("co.empty")}</p>}
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
            <span className="mono">{t("co.subtotal")}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {off > 0 && (
            <div className={styles.sub}>
              <span className="mono">{t("co.discount")} · {applied!.code}</span>
              <span>−{formatPrice(off)}</span>
            </div>
          )}
          <div className={styles.sub}>
            <span className="mono">{t("co.shipping")}</span>
            <span>{zones?.length && !zoneId && !applied?.freeShipping && subtotal > 0 ? t("co.chooseArea") : shipping === 0 ? t("co.free") : formatPrice(shipping)}</span>
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
              placeholder={t("co.code")}
              aria-label={t("co.code")}
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
                {t("co.remove")}
              </button>
            ) : (
              <button type="button" className="mono" onClick={apply} disabled={checking || !code.trim() || empty}>
                {checking ? "…" : t("co.apply")}
              </button>
            )}
          </div>
          {promo && (
            <p className={styles.promoNote} role="status">
              {promo.ok ? t("co.applied", { label: promo.label }) : promo.error}
            </p>
          )}
          <div className={styles.total}>
            <span className="mono">{t("co.total")}</span>
            <span className="display">{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
