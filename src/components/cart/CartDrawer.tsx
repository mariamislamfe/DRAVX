"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useCart, useHydrated, useUI } from "@/lib/store";
import { cartTotals } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog";
import { formatPrice } from "@/config/brand";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { CartLineItem } from "./CartLineItem";
import { ShippingMeter } from "./ShippingMeter";
import styles from "./Cart.module.css";

export function CartDrawer() {
  const open = useUI((s) => s.cartOpen);
  const setOpen = useUI((s) => s.setCartOpen);
  const lines = useCart((s) => s.lines);
  const hydrated = useHydrated();
  const { resolved, subtotal, count } = cartTotals(hydrated ? lines : [], useCatalog());
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    tl.current = gsap
      .timeline({ paused: true })
      .set(root.current, { visibility: "visible" })
      .fromTo(root.current!.querySelector(`.${styles.scrim}`), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 })
      .fromTo(panel.current, { xPercent: 102 }, { xPercent: 0, duration: 0.7, ease: "power4.out" }, 0);
    return () => {
      tl.current?.kill();
    };
  }, []);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      tl.current?.timeScale(1).play();
      gsap.fromTo(
        panel.current!.querySelectorAll("[data-stagger]"),
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.6, delay: 0.15, ease: "power3.out" }
      );
      setTimeout(() => panel.current?.querySelector<HTMLElement>("button")?.focus(), 50);
    } else {
      tl.current?.timeScale(1.5).reverse();
      lastFocus.current?.focus?.();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div ref={root} className={styles.drawerRoot} aria-hidden={!open} inert={!open}>
      <div className={styles.scrim} onClick={() => setOpen(false)} />
      <aside ref={panel} className={`${styles.drawer} on-paper`} role="dialog" aria-modal="true" aria-label="Shopping bag" data-lenis-prevent>
        <div className={styles.drawerHead}>
          <h2 className="display">
            Bag <sup className="mono">({count})</sup>
          </h2>
          <button type="button" className="mono link-u" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>

        {resolved.length === 0 ? (
          <div className={styles.empty}>
            <p className={`${styles.emptyTitle} display`} data-stagger>
              Nothing on your back yet.
            </p>
            <p data-stagger>Pick a side. Both of them are loud.</p>
            <div className={styles.emptyLinks} data-stagger>
              <TransitionLink href="/shop?world=daydream" className="btn btn--ink">
                Daydream
              </TransitionLink>
              <TransitionLink href="/shop?world=nightshift" className="btn btn--ghost">
                Nightshift
              </TransitionLink>
            </div>
          </div>
        ) : (
          <>
            <div data-stagger>
              <ShippingMeter subtotal={subtotal} />
            </div>
            <ul className={styles.lines}>
              {resolved.map((l) => (
                <CartLineItem key={l.key} line={l} />
              ))}
            </ul>
            <div className={styles.drawerFoot} data-stagger>
              <div className={styles.subtotal}>
                <span className="mono">Subtotal</span>
                <span className="display">{formatPrice(subtotal)}</span>
              </div>
              <p className={`${styles.note} mono`}>Shipping calculated at checkout · cash on delivery.</p>
              <TransitionLink href="/checkout" className="btn btn--ink btn--block">
                Checkout <span className="arrow">→</span>
              </TransitionLink>
              <TransitionLink href="/cart" className={`${styles.viewBag} mono link-u`}>
                View full bag
              </TransitionLink>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
