"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { useCatalog, useText } from "@/lib/catalog";
import { formatPrice } from "@/config/brand";
import { plain } from "@/data/content";
import type { HomeVideo } from "@/data/schema";
import { Logo } from "@/components/brand/Logo";
import { Rich } from "@/components/brand/Rich";
import { Garment } from "@/components/product/Garment";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { productTransition } from "@/components/product/ProductCard";
import styles from "./VideoShowcase.module.css";

/**
 * Full-width brand film, set up in Dashboard → Homepage: a looping muted video
 * with the logo, a message, a button and products on top. The file is only
 * fetched once the section is near the screen; phones get the lighter file.
 */
export function VideoShowcase({ id, video: v }: { id: string; video: HomeVideo }) {
  const root = useRef<HTMLElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const { products: all } = useCatalog();
  const t = useText();
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const products = v.products.map((s) => all.find((p) => p.slug === s)).filter((p) => !!p);

  // fetch the video only when the section comes near
  useEffect(() => {
    const el = root.current;
    if (!el || !v.src) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const phone = window.matchMedia("(max-width: 700px)").matches;
        setSrc(phone && v.mobileSrc ? v.mobileSrc : v.src);
      },
      { rootMargin: "60% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [v.src, v.mobileSrc]);

  // play only while on screen; reduced motion leaves it paused on the poster
  useEffect(() => {
    const el = root.current;
    const video = vid.current;
    if (!el || !video || !src || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        `.${styles.media}`,
        { scale: 1.18 },
        { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: true } }
      );
      gsap.from(`.${styles.copy} > *`, {
        y: 50,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: { trigger: root.current, start: "top 60%" },
      });
      if (root.current?.querySelector(`.${styles.product}`)) {
        gsap.from(`.${styles.product}`, {
          y: 60,
          autoAlpha: 0,
          stagger: 0.08,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: { trigger: `.${styles.products}`, start: "top 95%" },
        });
      }
    },
    { scope: root }
  );

  const toggle = () => {
    const video = vid.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const titleId = `${id}-title`;
  const shade = Math.min(80, Math.max(0, v.overlay)) / 100;

  return (
    <section
      ref={root}
      className={`${styles.section} on-ink`}
      data-align={v.align}
      data-height={v.height}
      aria-labelledby={v.title ? titleId : undefined}
      aria-label={v.title ? undefined : "Video"}
    >
      <div className={styles.media} aria-hidden="true">
        {v.src ? (
          <video
            ref={vid}
            className={styles.video}
            src={src ?? undefined}
            poster={v.poster || undefined}
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        ) : v.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.video} src={v.poster} alt="" />
        ) : (
          <div className={styles.fallback} />
        )}
      </div>
      <div className={styles.shade} style={{ "--shade": shade } as React.CSSProperties} aria-hidden="true" />

      <div className={`${styles.inner} wrap`}>
        <div className={styles.copy}>
          {v.showLogo &&
            (v.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.logoImg} src={v.logo} alt="" />
            ) : (
              <Logo variant="wordmark" className={styles.logo} decorative />
            ))}
          {v.eyebrow && <p className="mono">{v.eyebrow}</p>}
          {v.title && (
            <h2 id={titleId} className={`${styles.title} display`}>
              <Rich text={v.title} />
            </h2>
          )}
          {v.text && <p className={styles.text}>{v.text}</p>}
          {v.ctaLabel && v.ctaHref && (
            <TransitionLink href={v.ctaHref} className="btn">
              {v.ctaLabel} <span className="arrow">→</span>
            </TransitionLink>
          )}
        </div>

        {products.length > 0 && (
          <ul className={styles.products} aria-label={v.title ? `${plain(v.title)}: products` : "Products"}>
            {products.map((p) => (
              <li key={p.slug} className={styles.product}>
                <TransitionLink href={`/product/${p.slug}`} transition={productTransition(p)} className={styles.productLink}>
                  <span className={styles.thumb}>
                    <Garment product={p} view="back" decorative sizes="96px" />
                  </span>
                  <span className={styles.productInfo}>
                    <span className="display">{p.shortName}</span>
                    <span className="mono">{formatPrice(p.price)}</span>
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </TransitionLink>
              </li>
            ))}
          </ul>
        )}
      </div>

      {src && (
        <button type="button" className={`${styles.toggle} mono`} onClick={toggle} aria-pressed={!playing}>
          {playing ? t("video.mute") : t("video.play")}
        </button>
      )}
    </section>
  );
}
