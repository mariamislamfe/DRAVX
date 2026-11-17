"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { TransitionLink } from "@/components/transition/TransitionLink";
import styles from "./DropGrid.module.css";

export function DropGrid() {
  const root = useRef<HTMLElement>(null);
  const products = useCatalog().products.slice(0, 6);

  useGSAP(
    () => {
      gsap.from(`.${styles.cell}`, {
        y: 90,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: { trigger: `.${styles.grid}`, start: "top 88%" },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className={`${styles.section} on-paper`} aria-labelledby="drop-title">
      <div className="wrap">
        <header className={styles.head}>
          <h2 id="drop-title" className="display">
            Shop Drop <em className="serif">01</em>
          </h2>
          <TransitionLink href="/shop" className="mono link-u">
            View all →
          </TransitionLink>
        </header>
        <div className={styles.grid}>
          {products.map((p, i) => (
            <div key={p.slug} className={styles.cell}>
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
