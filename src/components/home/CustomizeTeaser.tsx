"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useCatalog, useText } from "@/lib/catalog";
import { Rich } from "@/components/brand/Rich";
import { formatPrice } from "@/config/brand";
import { mockupFor, type TemplateView } from "@/data/schema";
import { TransitionLink } from "@/components/transition/TransitionLink";
import styles from "./CustomizeTeaser.module.css";


/** Home-page entry to the customizer, built from the first customizer base. */
export function CustomizeTeaser() {
  const root = useRef<HTMLElement>(null);
  const t = useCatalog().templates[0];
  const tx = useText();
  const STEPS = [1, 2, 3].map((n) => [tx(`ct.s${n}t`), tx(`ct.s${n}b`)] as const);

  useGSAP(
    () => {
      if (!t) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 70%" } });
      // animate the images, not the wrappers: the wrappers' CSS transforms drive the hover
      tl.from(`.${styles.garment} img`, { y: 90, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: "power4.out" })
        .from(`.${styles.area}`, { scale: 0.6, autoAlpha: 0, duration: 0.7, ease: "back.out(2)" }, "-=0.6")
        .from(`.${styles.copy} > *`, { y: 30, autoAlpha: 0, stagger: 0.07, duration: 0.9, ease: "power3.out" }, 0.1);
    },
    { scope: root, dependencies: [t?.id] }
  );

  if (!t) return null;
  const view: TemplateView | undefined = t.views.find((v) => v.enabled && v.side === "back") ?? t.views.find((v) => v.enabled);
  if (!view) return null;
  // colours with a real photo of this side look best; fall back to the plain mockup
  const withPhoto = t.colors.filter((c) => c.photos?.[view.side]);
  const shown = withPhoto.length ? withPhoto.slice(0, 2) : t.colors.slice(0, 1);
  const cheapest = t.basePrice + Math.min(...t.views.filter((v) => v.enabled).map((v) => v.printPrice));

  return (
    <section ref={root} className={`${styles.section} on-paper`} aria-labelledby="customize-title">
      <div className={`${styles.inner} wrap`}>
        <div className={styles.copy}>
          <p className="mono">{tx("ct.kicker")}</p>
          <h2 id="customize-title" className="display">
            <Rich text={tx("ct.title")} />
          </h2>
          <p className={styles.lead}>
            {tx("ct.lead", { garment: t.name.toLowerCase().replace(/^custom\s+/, ""), price: formatPrice(cheapest) })}
          </p>
          <ol className={styles.steps}>
            {STEPS.map(([title, body], i) => (
              <li key={i}>
                <span className="mono">0{i + 1}</span>
                <strong>{title}</strong>
                <span>{body}</span>
              </li>
            ))}
          </ol>
          <TransitionLink href="/customize" className="btn btn--ink">
            {tx("ct.cta")} <span className="arrow">→</span>
          </TransitionLink>
        </div>

        <TransitionLink href="/customize" className={styles.stage} aria-label="Open the custom studio">
          {shown.map((c, i) => {
            const { src } = mockupFor(view, c, false);
            return (
              <div key={c.id} className={styles.garment} data-i={i} data-count={shown.length} style={{ aspectRatio: `${view.mockupW} / ${view.mockupH}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" draggable={false} />
                {i === shown.length - 1 && (
                  <span
                    className={styles.area}
                    style={{ left: `${view.area.x * 100}%`, top: `${view.area.y * 100}%`, width: `${view.area.w * 100}%`, height: `${view.area.h * 100}%` }}
                    data-dark={luminance(c.hex) < 0.45 || undefined}
                  >
                    <span className="hand">{tx("ct.area")}</span>
                  </span>
                )}
              </div>
            );
          })}
        </TransitionLink>
      </div>
    </section>
  );
}

function luminance(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
