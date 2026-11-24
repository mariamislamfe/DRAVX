"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { useOnReady } from "@/lib/useReady";
import { pickProduct, useCatalog, useText } from "@/lib/catalog";
import { formatPrice } from "@/config/brand";
import { Garment } from "@/components/product/Garment";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { useTransitionNav } from "@/components/transition/TransitionProvider";
import { productTransition } from "@/components/product/ProductCard";
import styles from "./Hero.module.css";

/**
 * Backdrop for a hoodie, from its colour in the dashboard. Dark garments get
 * a dark, tinted stage with a cool glow; light ones a soft tinted paper.
 */
function backdrop(hex: string) {
  const c = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#111111";
  const n = parseInt(c.slice(1), 16);
  const lum = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  if (lum < 0.45) {
    return `radial-gradient(60% 65% at 60% 55%, color-mix(in srgb, ${c} 70%, #33438a) 0%, color-mix(in srgb, ${c} 80%, #0b0d18) 50%, color-mix(in srgb, ${c} 60%, #0b0b0c) 100%)`;
  }
  return `radial-gradient(70% 70% at 40% 55%, color-mix(in srgb, ${c} 16%, #fbf9f4) 0%, color-mix(in srgb, ${c} 30%, #ebe7de) 60%)`;
}


/**
 * Shoppable hero. Both hoodies are seen from the back in the same spot,
 * split by a line that follows the pointer. Click a half to open that
 * product; hovering a product tag pushes the split toward it.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const intro = useRef<gsap.core.Timeline | null>(null);
  const splitTo = useRef<((v: number) => void) | null>(null);
  const splitVal = useRef(50);
  const ready = useRef(false);
  const { navigate } = useTransitionNav();
  const { products, settings } = useCatalog();
  const t = useText();
  // chosen in Dashboard → Homepage; falls back if a pick was deleted or hidden
  const day = pickProduct(products, settings.home?.heroLeft, 0)!;
  const night = pickProduct(products, settings.home?.heroRight, 1)!;

  useGSAP(
    () => {
      const st = stage.current!;
      const split = { v: 100 };
      const apply = () => {
        st.style.setProperty("--split", `${split.v}%`);
        splitVal.current = split.v;
      };
      apply();
      const reduced = prefersReducedMotion();

      gsap.set(`.${styles.title} .mask > span`, { yPercent: 105 });
      gsap.set(`.${styles.figures}`, { yPercent: 10, autoAlpha: 0 });
      gsap.set("[data-hero-tag]", { autoAlpha: 0, y: 24 });

      intro.current = gsap
        .timeline({ paused: true, defaults: { ease: "power4.out" } })
        .to(`.${styles.figures}`, { yPercent: 0, autoAlpha: 1, duration: 1.4 }, 0)
        .to(split, { v: reduced ? 50 : 0, duration: reduced ? 0.01 : 0.9, ease: "power3.inOut", onUpdate: apply }, 0.1)
        .to(split, { v: 50, duration: 0.9, ease: "power3.inOut", onUpdate: apply })
        .to(`.${styles.title} .mask > span`, { yPercent: 0, duration: 1.1, stagger: 0.08 }, 0.4)
        .to("[data-hero-tag]", { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, 1.1)
        .add(() => {
          ready.current = true;
        });

      const quick = gsap.quickTo(split, "v", { duration: 0.8, ease: "power3.out", onUpdate: apply });
      splitTo.current = quick;
      const figX = gsap.quickTo(`.${styles.figures}`, "x", { duration: 1.2, ease: "power3.out" });

      const onMove = (e: PointerEvent) => {
        if (!ready.current || reduced) return;
        if (e.pointerType !== "mouse" && e.buttons === 0) return;
        const r = st.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        quick(gsap.utils.clamp(8, 92, px * 100));
        figX((px - 0.5) * -18);
      };
      st.addEventListener("pointermove", onMove);

      if (!reduced) {
        gsap.to(`.${styles.figures}`, {
          scale: 1.12,
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      }
      return () => st.removeEventListener("pointermove", onMove);
    },
    { scope: root }
  );

  useOnReady(() => intro.current?.play());

  const openHalf = (e: React.MouseEvent) => {
    const r = stage.current!.getBoundingClientRect();
    const pct = ((e.clientX - r.left) / r.width) * 100;
    const p = pct < splitVal.current ? day : night;
    navigate(`/product/${p.slug}`, productTransition(p));
  };

  const lean = (v: number | null) => {
    if (ready.current) splitTo.current?.(v ?? 50);
  };

  return (
    <section ref={root} className={styles.hero} aria-labelledby="hero-title">
      <div ref={stage} className={styles.stage} onClick={openHalf} role="presentation">
        <div className={`${styles.world} ${styles.night}`} style={{ background: backdrop(night.colorHex) }} aria-hidden="true">
          <div className={styles.beam} />
          <div className={styles.figures}>
            <Garment product={night} view="back" priority decorative sizes="(max-width: 900px) 90vw, 46vw" />
          </div>
        </div>
        <div className={`${styles.world} ${styles.day}`} style={{ background: backdrop(day.colorHex) }} aria-hidden="true">
          <div className={styles.figures}>
            <Garment product={day} view="back" priority decorative sizes="(max-width: 900px) 90vw, 46vw" />
          </div>
        </div>
        <div className={styles.divider} aria-hidden="true">
          <span className={styles.handle}>⟷</span>
        </div>
      </div>

      <h1 id="hero-title" className={`${styles.title} display`}>
        <span className="mask">
          <span>{t("hero.line1")}</span>
        </span>
        <span className="mask">
          <span>{t("hero.line2")}</span>
        </span>
      </h1>

      <div className={styles.tags}>
        {[day, night].map((p, i) => (
          <TransitionLink
            key={`${p.slug}-${i}`}
            href={`/product/${p.slug}`}
            transition={productTransition(p)}
            className={styles.tag}
            data-world={i === 0 ? "daydream" : "nightshift"} /* tag colours follow the half, not the product */
            data-hero-tag
            onPointerEnter={() => lean(i === 0 ? 78 : 22)}
            onPointerLeave={() => lean(null)}
            onFocus={() => lean(i === 0 ? 78 : 22)}
            onBlur={() => lean(null)}
          >
            <span className={styles.tagInfo}>
              <span className={`${styles.tagName} display`}>{p.shortName}</span>
              <span className="mono">{formatPrice(p.price)}</span>
            </span>
            <span className={`${styles.tagCta} mono`}>
              <span className={styles.ctaWord}>{t("hero.shop")}&nbsp;</span>→
            </span>
          </TransitionLink>
        ))}
      </div>
    </section>
  );
}
