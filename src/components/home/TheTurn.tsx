"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { WORLDS } from "@/data/products";
import { byWorld, useCatalog } from "@/lib/catalog";
import { formatPrice } from "@/config/brand";
import { ProductVisual } from "@/components/product/ProductVisual";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { productTransition } from "@/components/product/ProductCard";
import styles from "./TheTurn.module.css";

const NOTES: Record<string, { front: string[]; back: string[] }> = {
  "rex-doodle-hoodie": {
    front: ["Small ROARR chest graphic", "Kangaroo pocket", "Dropped shoulders"],
    back: ["Full-back T-rex on a skateboard", "Hand-written notes: “Wild one”, “Super cool”"],
  },
  "third-eye-hoodie": {
    front: ["Eye sigil chest logo, ~6 cm", "Black, oversized drape", "Metal-tipped drawcords"],
    back: ["40 × 40 cm back print", "4 back designs to choose from"],
  },
};

/**
 * Editorial showcase: a pinned stage where each hoodie physically turns
 * from front to back as you scroll, with spec call-outs on each side.
 */
export function TheTurn() {
  const root = useRef<HTMLElement>(null);
  const all = useCatalog().products;
  // the turn choreography is built for exactly two hoodies: one per world
  const products = [byWorld(all, "daydream")!, byWorld(all, "nightshift")!];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 901px)", mobile: "(max-width: 900px)" }, (ctx) => {
        const { desktop } = ctx.conditions as { desktop: boolean };
        const cards = gsap.utils.toArray<HTMLElement>(`.${styles.card}`);
        const texts = gsap.utils.toArray<HTMLElement>(`.${styles.text}`);
        const notesF = gsap.utils.toArray<HTMLElement>(`.${styles.notesFront}`);
        const notesB = gsap.utils.toArray<HTMLElement>(`.${styles.notesBack}`);

        gsap.set(cards[1], { yPercent: 130, rotation: 6, autoAlpha: 0 });
        gsap.set(texts[1].querySelectorAll("[data-t]"), { yPercent: 110 });
        gsap.set([...notesF, ...notesB].flatMap((n) => Array.from(n.children)), { autoAlpha: 0, x: (i) => (i % 2 ? 20 : -20) });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: desktop ? "+=260%" : "+=200%",
            scrub: 0.8,
            pin: `.${styles.pin}`,
            anticipatePin: 1,
          },
        });

        const turn = (i: number, at: number) => {
          const inner = cards[i].querySelector(`.${styles.inner}`);
          // front notes → hold → turn → back notes → hold
          tl.to(notesF[i].children, { autoAlpha: 1, x: 0, stagger: 0.1, duration: 0.35 }, at)
            .to(notesF[i].children, { autoAlpha: 0, x: -10, stagger: 0.04, duration: 0.25 }, at + 1)
            .to(inner, { rotationY: 180, duration: 0.8 }, at + 1.1)
            .to(cards[i], { scale: 1.06, duration: 0.4, yoyo: true, repeat: 1 }, at + 1.1)
            .to(notesB[i].children, { autoAlpha: 1, x: 0, stagger: 0.1, duration: 0.35 }, at + 1.9);
        };

        const H = 3.2; // hand-over point
        turn(0, 0);
        tl.to(notesB[0].children, { autoAlpha: 0, duration: 0.25 }, H)
          .to(cards[0], { yPercent: -120, rotation: -8, duration: 0.8, ease: "power3.in" }, H + 0.05)
          .to(cards[1], { yPercent: 0, rotation: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }, H + 0.35)
          .to(`.${styles.bgNight}`, { opacity: 1, duration: 0.6 }, H + 0.2)
          .to(texts[0].querySelectorAll("[data-t]"), { yPercent: -110, stagger: 0.05, duration: 0.4 }, H + 0.1)
          .to(texts[1].querySelectorAll("[data-t]"), { yPercent: 0, stagger: 0.05, duration: 0.5 }, H + 0.5);
        turn(1, H + 1.1);
        tl.to({}, { duration: 1 });
        tl.to(`.${styles.progress} i`, { scaleX: 1, duration: tl.duration(), ease: "none" }, 0);
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.section} aria-labelledby="turn-title">
      <div className={styles.pin}>
        <div className={styles.bgDay} aria-hidden="true" />
        <div className={styles.bgNight} aria-hidden="true" />
        <h2 id="turn-title" className={`${styles.kicker} mono`}>
          The turn — editorial
        </h2>
        <div className={styles.progress} aria-hidden="true">
          <i />
        </div>

        <div className={styles.texts}>
          {products.map((p, i) => (
            <div key={`${p.slug}-${i}`} className={styles.text} data-world={p.world}>
              <span className="mask">
                <span data-t className="mono">
                  {WORLDS[p.world].index} / {WORLDS[p.world].label}
                </span>
              </span>
              <span className="mask">
                <span data-t className={`${styles.name} display`}>
                  {p.shortName}
                </span>
              </span>
              <span className="mask">
                <span data-t className={styles.line}>
                  {p.tagline}
                </span>
              </span>
              <span className="mask">
                <span data-t>
                  <TransitionLink href={`/product/${p.slug}`} className={`${styles.cta} mono link-u`} transition={productTransition(p)}>
                    Shop {p.shortName} — {formatPrice(p.price)} →
                  </TransitionLink>
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.stage}>
          {products.map((p, i) => (
            <div key={`${p.slug}-${i}`} className={styles.card} data-world={p.world}>
              <div className={styles.inner}>
                <div className={`${styles.face} ${styles.front}`}>
                  <ProductVisual product={p} kind="front" sizes="(max-width: 900px) 80vw, 36vw" />
                </div>
                <div className={`${styles.face} ${styles.back}`}>
                  <ProductVisual product={p} kind="back" sizes="(max-width: 900px) 80vw, 36vw" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.notes}>
          {products.map((p, i) => (
            <div key={`${p.slug}-${i}`} className={styles.noteSet}>
              <ul className={styles.notesFront} aria-label={`${p.shortName} front details`}>
                {NOTES[p.slug].front.map((n) => (
                  <li key={n}>
                    <span className="mono">Front</span> {n}
                  </li>
                ))}
              </ul>
              <ul className={styles.notesBack} aria-label={`${p.shortName} back details`}>
                {NOTES[p.slug].back.map((n) => (
                  <li key={n}>
                    <span className="mono">Back</span> {n}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
