"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useCatalog, useText } from "@/lib/catalog";
import { Rich } from "@/components/brand/Rich";
import { ProductCard } from "@/components/product/ProductCard";
import { TransitionLink } from "@/components/transition/TransitionLink";
import styles from "./DropGrid.module.css";

export function DropGrid() {
  const root = useRef<HTMLElement>(null);
  const products = useCatalog().products.slice(0, 6);
  const t = useText();

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
            <Rich text={t("drop.title")} />
          </h2>
          <TransitionLink href="/shop" className="mono link-u">
            {t("drop.viewAll")}
          </TransitionLink>
        </header>
        <div className={styles.grid}>
          {products.map((p, i) => (
            <div key={p.slug} className={styles.cell}>
              <ProductCard product={p} index={i} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
