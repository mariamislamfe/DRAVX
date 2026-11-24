"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { gsap, useGSAP, splitChars } from "@/lib/gsap";
import { useOnReady } from "@/lib/useReady";
import { getColor, type ImageKind } from "@/data/products";
import { findProduct, useCatalog, useText } from "@/lib/catalog";
import { Rich } from "@/components/brand/Rich";
import { ProductCard } from "@/components/product/ProductCard";
import { NotifyTile } from "@/components/product/NotifyTile";
import { ProductVisual } from "@/components/product/ProductVisual";
import { Gallery } from "./Gallery";
import { BuyPanel } from "./BuyPanel";
import { Lightbox } from "./Lightbox";
import styles from "./Pdp.module.css";

export function ProductView({ slug }: { slug: string }) {
  const catalog = useCatalog();
  const t = useText();
  const product = findProduct(catalog, slug)!;
  const params = useSearchParams();
  const initialVariant = product.printVariants?.find((v) => v.id === params.get("print"))?.id ?? product.printVariants?.[0]?.id;
  const [view, setView] = useState<ImageKind>(params.get("print") ? "back" : "front");
  const [variant, setVariant] = useState<string | undefined>(initialVariant);
  const [color, setColor] = useState<string>(() => getColor(product, params.get("color") ?? undefined).id);
  const [zoom, setZoom] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const intro = useRef<gsap.core.Timeline | null>(null);
  const related = catalog.products.filter((p) => p.slug !== product.slug).slice(0, 3);

  const chooseVariant = (id: string) => {
    setVariant(id);
    setView("back"); // show the print you just picked
  };
  const chooseColor = (id: string) => {
    setColor(id);
    // keep the colour in the address so a shared link opens on it
    const url = new URL(window.location.href);
    url.searchParams.set("color", id);
    window.history.replaceState(window.history.state, "", url);
  };

  useLayoutEffect(() => {
    const el = root.current!;
    const title = el.querySelector<HTMLElement>("[data-title]");
    const chars = title ? splitChars(title) : [];
    intro.current = gsap
      .timeline({ paused: true, defaults: { ease: "power4.out" } })
      .fromTo(el.querySelector("[data-stage]"), { clipPath: "inset(18% 12% 18% 12%)", scale: 1.06 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.4, ease: "expo.out" })
      .from(chars, { yPercent: 110, stagger: 0.025, duration: 1 }, 0.15)
      .from(el.querySelectorAll("[data-buy]"), { y: 24, autoAlpha: 0, stagger: 0.06, duration: 0.8 }, 0.35);
    return () => {
      intro.current?.revert();
    };
  }, []);
  useOnReady(() => intro.current?.play());

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
        const inner = el.firstElementChild;
        if (inner) gsap.fromTo(inner, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className={styles.page} data-world={product.world}>
      <div className={`${styles.top} wrap`}>
        <Gallery product={product} view={view} setView={setView} variant={variant} color={color} onZoom={setZoom} />
        <BuyPanel product={product} variant={variant} onVariant={chooseVariant} color={color} onColor={chooseColor} />
      </div>

      {/* editorial strip */}
      <section className={`${styles.editorial} wrap`} aria-label="Detail and lifestyle imagery">
        <figure className={`${styles.ed} ${styles.edA}`}>
          <div className={styles.edMedia} data-reveal>
            <div className={styles.edInner}>
              <ProductVisual product={product} kind="detail-front" color={color} sizes="(max-width: 900px) 100vw, 40vw" />
            </div>
          </div>
          <figcaption className="mono">{t("pdp.frontDetail")}</figcaption>
        </figure>
        <figure className={`${styles.ed} ${styles.edB}`}>
          <div className={styles.edMedia} data-reveal>
            <div className={styles.edInner}>
              <ProductVisual product={product} kind="detail-back" variant={variant} color={color} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
          </div>
          <figcaption className="mono">{t("pdp.backDetail")}</figcaption>
        </figure>
      </section>


      <section className={`${styles.related} wrap`} aria-labelledby="related-title">
        <h2 id="related-title" className="display">
          <Rich text={t("pdp.related")} />
        </h2>
        <div className={styles.relatedGrid}>
          {related.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
          <NotifyTile />
        </div>
      </section>

      <Lightbox product={product} variant={variant} color={color} index={zoom} onClose={() => setZoom(null)} onIndex={setZoom} />
    </div>
  );
}
