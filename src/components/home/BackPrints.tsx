"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Product } from "@/data/products";
import { useCatalog } from "@/lib/catalog";
import { formatPrice } from "@/config/brand";
import { Garment } from "@/components/product/Garment";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { productTransition } from "@/components/product/ProductCard";
import styles from "./BackPrints.module.css";

/** Every back design in the drop, one card each, linking straight to it. */
type Item = { product: Product; variant?: string; label: string; href: string };
const items = (products: Product[]): Item[] => products.flatMap((p): Item[] =>
  p.printVariants
    ? p.printVariants.map((v) => ({ product: p, variant: v.id, label: v.label, href: `/product/${p.slug}?print=${v.id}` }))
    : [{ product: p, variant: undefined, label: p.shortName, href: `/product/${p.slug}` }]
);

export function BackPrints() {
  const root = useRef<HTMLElement>(null);
  const ITEMS = items(useCatalog().products);

  useGSAP(
    () => {
      gsap.from(`.${styles.card}`, {
        y: 80,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: { trigger: `.${styles.row}`, start: "top 85%" },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.section} aria-labelledby="prints-title">
      <header className={`${styles.head} wrap`}>
        <h2 id="prints-title" className="display">
          Pick your <em className="serif">back.</em>
        </h2>
        <p className="mono">{ITEMS.length} back designs</p>
      </header>
      <div className={styles.row}>
        {ITEMS.map((it) => (
          <TransitionLink
            key={it.href}
            href={it.href}
            className={styles.card}
            data-world={it.product.world}
            transition={productTransition(it.product)}
          >
            <div className={styles.media}>
              <Garment product={it.product} view="back" variant={it.variant} sizes="(max-width: 900px) 70vw, 22vw" />
            </div>
            <div className={styles.info}>
              <span className={`${styles.name} display`}>{it.label}</span>
              <span className="mono">{formatPrice(it.product.price)}</span>
            </div>
          </TransitionLink>
        ))}
      </div>
    </section>
  );
}
