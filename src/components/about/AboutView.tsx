"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useOnReady } from "@/lib/useReady";
import { WORLDS } from "@/data/products";
import { Garment } from "@/components/product/Garment";

import { byWorld as pick, useCatalog, useText, worldLabel } from "@/lib/catalog";
import { Rich } from "@/components/brand/Rich";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Marquee } from "@/components/home/Marquee";
import styles from "./About.module.css";


export function AboutView() {
  const root = useRef<HTMLDivElement>(null);
  const { products } = useCatalog();
  const byWorld = (w: "daydream" | "nightshift") => pick(products, w)!;
  const t = useText();
  const CHAPTERS = [1, 2, 3, 4].map((n) => ({ n: `0${n}`, title: t(`about.c${n}t`), body: t(`about.c${n}b`) }));
  const night = products.length ? byWorld("nightshift") : undefined;
  const intro = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      intro.current = gsap
        .timeline({ paused: true, defaults: { ease: "power4.out" } })
        .from(`.${styles.heroLine} > span`, { yPercent: 110, stagger: 0.1, duration: 1.2 })
        .from(`.${styles.heroFig}`, { yPercent: 30, autoAlpha: 0, rotate: -10, duration: 1.4 }, 0.2)
        .from("[data-hero-fade]", { autoAlpha: 0, y: 16, duration: 0.8 }, 0.7);

      // hero hoodie turns around as you scroll away
      gsap.to(`.${styles.heroFigInner}`, {
        rotationY: 180,
        ease: "none",
        scrollTrigger: { trigger: `.${styles.hero}`, start: "top top", end: "bottom top", scrub: true },
      });

      // chapters: sticky number swaps as each chapter enters
      const nums = gsap.utils.toArray<HTMLElement>(`.${styles.bigNum} span`);
      gsap.set(nums.slice(1), { yPercent: 100 });
      gsap.utils.toArray<HTMLElement>(`.${styles.chapter}`).forEach((ch, i) => {
        gsap.from(ch.children, {
          y: 50,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: ch, start: "top 75%" },
        });
        if (i === 0) return;
        gsap
          .timeline({ scrollTrigger: { trigger: ch, start: "top 55%", toggleActions: "play none none reverse" } })
          .to(nums[i - 1], { yPercent: -100, duration: 0.6, ease: "power3.inOut" })
          .fromTo(nums[i], { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "power3.inOut" }, 0);
      });

      gsap.utils.toArray<HTMLElement>(`.${styles.world}`).forEach((w) => {
        gsap.fromTo(
          w.querySelector(`.${styles.worldFig}`),
          { yPercent: 20 },
          { yPercent: -20, ease: "none", scrollTrigger: { trigger: w, start: "top bottom", end: "bottom top", scrub: true } }
        );
      });
    },
    { scope: root }
  );
  useOnReady(() => intro.current?.play());

  return (
    <div ref={root} className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-title">
        <h1 id="about-title" className={`${styles.heroTitle} display`}>
          <span className={`${styles.heroLine} mask`}>
            <span><Rich text={t("about.l1")} /></span>
          </span>
          <span className={`${styles.heroLine} mask`}>
            <span><Rich text={t("about.l2")} /></span>
          </span>
          <span className={`${styles.heroLine} mask`}>
            <span><Rich text={t("about.l3")} /></span>
          </span>
          <span className={`${styles.heroLine} ${styles.loud} mask`}>
            <span><Rich text={t("about.l4")} /></span>
          </span>
        </h1>
        <div className={styles.heroFig} aria-hidden="true">
          <div className={styles.heroFigInner}>
            <div className={styles.face}>
              {night && <Garment product={night} view="front" priority decorative />}
            </div>
            <div className={`${styles.face} ${styles.faceBack}`}>
              {night && <Garment product={night} view="back" variant={night.printVariants?.at(-1)?.id} decorative />}
            </div>
          </div>
        </div>
        <p className={`${styles.heroNote} mono`} data-hero-fade>
          {t("about.note")}
        </p>
      </section>

      <Marquee tone="orange" items={t("about.marquee").split(",").map((s) => s.trim()).filter(Boolean)} />

      <section className={`${styles.chapters} wrap`} aria-label="What we believe">
        <div className={styles.sticky}>
          <p className="mono">{t("about.believe")}</p>
          <div className={`${styles.bigNum} display`} aria-hidden="true">
            {CHAPTERS.map((c) => (
              <span key={c.n}>{c.n}</span>
            ))}
          </div>
        </div>
        <div className={styles.chapterList}>
          {CHAPTERS.map((c) => (
            <article key={c.n} className={styles.chapter}>
              <span className="mono">{c.n} / 0{CHAPTERS.length}</span>
              <h2 className="display">{c.title}</h2>
              <p>{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.worlds} aria-label="The two worlds">
        {(["daydream", "nightshift"] as const).map((w) => (
          <div key={w} className={styles.world} data-world={w}>
            <div className={styles.worldCopy}>
              <span className="mono">
                {t("about.world", { index: WORLDS[w].index })}
              </span>
              <h2 className="display">{worldLabel(t, w)}</h2>
              <p>{t(`world.${w}.blurb`)}</p>
              <TransitionLink
                href={`/shop?world=${w}`}
                className="btn"
                transition={{ label: worldLabel(t, w), tone: w === "daydream" ? "concrete" : "blue" }}
              >
                {t("about.shop", { world: worldLabel(t, w) })} <span className="arrow">→</span>
              </TransitionLink>
            </div>
            <div className={styles.worldFig} aria-hidden="true">
              {products.length > 0 && <Garment product={byWorld(w)} view="back" decorative />}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
