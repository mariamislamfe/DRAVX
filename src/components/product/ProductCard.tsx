"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useCart } from "@/lib/store";
import { flyToCart } from "@/lib/fly";
import { WORLDS, type Product, type Size } from "@/data/products";
import { formatPrice } from "@/config/brand";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { ProductVisual } from "./ProductVisual";
import styles from "./ProductCard.module.css";

export function productTransition(p: Product) {
  return { label: p.shortName, tone: p.world === "daydream" ? ("concrete" as const) : ("blue" as const) };
}

export function ProductCard({ product, index = 0, priority }: { product: Product; index?: number; priority?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const media = useRef<HTMLAnchorElement>(null);
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState<Size | null>(null);
  const [flipped, setFlipped] = useState(false);

  // subtle 3D tilt toward the pointer
  useEffect(() => {
    const el = media.current;
    if (!el || !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
    gsap.set(el, { transformPerspective: 900 });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 8);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
    };
    const leave = () => (rx(0), ry(0));
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  const quickAdd = (size: Size, btn: HTMLElement) => {
    add({ slug: product.slug, size, variant: product.printVariants?.[0]?.id, color: product.colors?.[0]?.id });
    flyToCart(btn, product.world === "daydream" ? "#ff5b1f" : "#2d6bff");
    setAdded(size);
    window.setTimeout(() => setAdded(null), 1600);
  };

  const world = WORLDS[product.world];

  return (
    <article ref={ref} className={styles.card} data-world={product.world}>
      <div className={styles.mediaWrap}>
      <TransitionLink
        ref={media}
        href={`/product/${product.slug}`}
        className={styles.media}
        data-flipped={flipped ? "1" : undefined}
        transition={productTransition(product)}
        data-cursor="View"
        aria-label={`${product.name}, ${formatPrice(product.price)}`}
      >
        <div className={styles.layer}>
          <ProductVisual product={product} kind="front" priority={priority} sizes="(max-width: 700px) 100vw, 45vw" />
        </div>
        <div className={`${styles.layer} ${styles.back}`}>
          <ProductVisual product={product} kind="back" sizes="(max-width: 700px) 100vw, 45vw" tag={false} />
        </div>
        <span className={`${styles.index} mono`}>
          {String(index + 1).padStart(2, "0")} / {world.label}
        </span>
        {product.badge && <span className={`${styles.badge} tag ${product.world === "nightshift" ? "tag--blue" : ""}`}>{product.badge}</span>}
        <span className={`${styles.turn} hand`} aria-hidden="true">
          hover to turn ↻
        </span>
      </TransitionLink>
      <button
        type="button"
        className={`${styles.flip} mono`}
        aria-pressed={flipped}
        onClick={() => setFlipped((f) => !f)}
      >
        {flipped ? "Front" : "Back"} ↻
      </button>
      </div>

      <div className={styles.info}>
        <div>
          <h3 className={`${styles.name} display`}>
            <TransitionLink href={`/product/${product.slug}`} transition={productTransition(product)}>
              {product.name}
            </TransitionLink>
          </h3>
          <p className={`${styles.meta} mono`}>
            {product.colors && product.colors.length > 1 ? `${product.colors.length} colours` : product.colorName}
            {product.printVariants ? ` · ${product.printVariants.length} back prints` : ""}
          </p>
        </div>
        <p className={`${styles.price} display`}>{formatPrice(product.price)}</p>
      </div>

      <div className={styles.quick} role="group" aria-label={`Quick add ${product.name}`}>
        <span className={`${styles.quickLabel} mono`}>{added ? `Added size ${added} ✓` : "Quick add"}</span>
        <div className={styles.sizes}>
          {product.sizes.map((s) => {
            const out = product.soldOut.includes(s);
            return (
              <button
                key={s}
                type="button"
                className={`${styles.size} mono`}
                disabled={out}
                data-added={added === s ? "1" : undefined}
                onClick={(e) => quickAdd(s, e.currentTarget)}
                aria-label={out ? `${s}, sold out` : `Add size ${s} to bag`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
