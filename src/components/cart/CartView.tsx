"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, splitChars } from "@/lib/gsap";
import { useOnReady } from "@/lib/useReady";
import { useCart, useHydrated } from "@/lib/store";
import { cartTotals } from "@/lib/cart";
import { BRAND, formatPrice } from "@/config/brand";
import { products } from "@/data/products";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { ProductCard } from "@/components/product/ProductCard";
import { CartLineItem } from "./CartLineItem";
import { ShippingMeter } from "./ShippingMeter";
import styles from "./CartPage.module.css";

export function CartView() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const { resolved, subtotal, count } = cartTotals(hydrated ? lines : []);
  const root = useRef<HTMLDivElement>(null);
  const intro = useRef<gsap.core.Timeline | null>(null);
  const inBag = new Set(resolved.map((l) => l.slug));
  const suggestions = products.filter((p) => !inBag.has(p.slug));

  useLayoutEffect(() => {
    const chars = splitChars(root.current!.querySelector<HTMLElement>("[data-title]")!);
    intro.current = gsap
      .timeline({ paused: true })
      .from(chars, { yPercent: 110, stagger: 0.04, duration: 1, ease: "power4.out" })
      .from(root.current!.querySelectorAll("[data-intro]"), { y: 20, autoAlpha: 0, stagger: 0.06, duration: 0.7 }, "-=0.6");
    return () => {
      intro.current?.revert();
    };
  }, []);
  useOnReady(() => intro.current?.play());

  return (
    <div ref={root} className={`${styles.page} on-paper`}>
      <div className="wrap">
        <header className={styles.head}>
          <h1 className={`${styles.title} display`} data-title>
            Your bag
          </h1>
          <span className={`${styles.count} display`} data-intro>
            ({String(count).padStart(2, "0")})
          </span>
        </header>

        {!hydrated ? (
          <div className={styles.loading} aria-busy="true" aria-label="Loading bag">
            <span />
            <span />
          </div>
        ) : resolved.length === 0 ? (
          <div className={styles.empty} data-intro>
            <p className={`${styles.emptyTitle} display`}>
              Nothing on <br />
              your back <em className="serif">yet.</em>
            </p>
            <p>Pick a side. Both of them are loud.</p>
            <div className={styles.emptyCtas}>
              <TransitionLink href="/shop?world=daydream" className="btn btn--ink">
                Shop Daydream
              </TransitionLink>
              <TransitionLink href="/shop?world=nightshift" className="btn btn--ghost">
                Shop Nightshift
              </TransitionLink>
            </div>
          </div>
        ) : (
          <div className={styles.layout}>
            <ul className={styles.lines} data-intro aria-label="Items in your bag">
              {resolved.map((l) => (
                <CartLineItem key={l.key} line={l} large />
              ))}
            </ul>

            <aside className={styles.summary} data-intro aria-label="Order summary">
              <h2 className="mono">Summary</h2>
              <ShippingMeter subtotal={subtotal} />
              <dl className={styles.rows}>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{subtotal >= BRAND.freeShippingThreshold ? "Free" : "At checkout"}</dd>
                </div>
                <div>
                  <dt>Taxes</dt>
                  <dd>At checkout</dd>
                </div>
              </dl>
              <div className={styles.total}>
                <span className="mono">Estimated total</span>
                <span className="display">{formatPrice(subtotal)}</span>
              </div>
              <TransitionLink href="/checkout" className="btn btn--ink btn--block">
                Checkout <span className="arrow">→</span>
              </TransitionLink>
              <TransitionLink href="/shop" className={`${styles.keep} mono link-u`}>
                Keep shopping
              </TransitionLink>
            </aside>
          </div>
        )}

        {hydrated && suggestions.length > 0 && resolved.length > 0 && (
          <section className={styles.suggest} aria-labelledby="suggest-title">
            <h2 id="suggest-title" className="display">
              Complete the <em className="serif">other</em> side
            </h2>
            <div className={styles.suggestGrid}>
              {suggestions.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
