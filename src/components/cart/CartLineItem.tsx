"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useCart } from "@/lib/store";
import type { ResolvedLine } from "@/lib/cart";
import { formatPrice } from "@/config/brand";
import { ProductVisual } from "@/components/product/ProductVisual";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { QtyStepper } from "./QtyStepper";
import styles from "./Cart.module.css";

export function CartLineItem({ line, large }: { line: ResolvedLine; large?: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const p = line.product;

  const onRemove = () => {
    const el = ref.current;
    if (!el) return remove(line.key);
    gsap
      .timeline({ onComplete: () => remove(line.key) })
      .to(el, { xPercent: 12, autoAlpha: 0, duration: 0.35, ease: "power2.in" })
      .to(el, { height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, duration: 0.35, ease: "power3.inOut" });
  };

  return (
    <li ref={ref} className={`${styles.line} ${large ? styles.lineLarge : ""}`}>
      <TransitionLink
        href={line.href}
        className={styles.thumb}
        transition={p ? { label: p.shortName, tone: p.world === "daydream" ? "concrete" : "blue" } : { label: "Custom", tone: "blue" }}
        aria-label={line.name}
      >
        {p ? (
          <ProductVisual product={p} kind="back" variant={line.variant} tag={false} sizes="120px" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "var(--paper-2)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user upload, already sized */}
            {line.thumb && <img src={line.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
          </div>
        )}
      </TransitionLink>
      <div className={styles.lineInfo}>
        <div className={styles.lineTop}>
          <h3 className={styles.lineName}>{line.name}</h3>
          <span className="mono">{formatPrice(line.lineTotal)}</span>
        </div>
        <p className={`${styles.lineMeta} mono`}>{line.meta}</p>
        <div className={styles.lineActions}>
          <QtyStepper compact value={line.qty} onChange={(q) => setQty(line.key, q)} label={`Quantity for ${line.name}`} />
          <button type="button" className={`${styles.remove} mono link-u`} onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
