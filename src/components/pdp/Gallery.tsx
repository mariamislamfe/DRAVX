"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { getImage, type ImageKind, type Product } from "@/data/products";
import { ProductVisual } from "@/components/product/ProductVisual";
import styles from "./Pdp.module.css";

export const GALLERY: { kind: ImageKind; label: string }[] = [
  { kind: "front", label: "Front" },
  { kind: "back", label: "Back" },
  { kind: "detail-front", label: "Chest detail" },
  { kind: "detail-back", label: "Print detail" },
  { kind: "model", label: "Lookbook" },
];

const isTurn = (k: ImageKind) => k === "front" || k === "back";

type Props = {
  product: Product;
  view: ImageKind;
  setView: (k: ImageKind) => void;
  variant?: string;
  onZoom: (i: number) => void;
};

export function Gallery({ product, view, setView, variant, onZoom }: Props) {
  const [shown, setShown] = useState<ImageKind>(view);
  const inner = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLButtonElement>(null);
  const pending = useRef<null | { type: "flip" | "wipe"; dir: number }>(null);
  const swipe = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);

  // out-animation, then swap
  useEffect(() => {
    if (view === shown) return;
    const el = inner.current!;
    if (prefersReducedMotion()) {
      setShown(view);
      return;
    }
    if (isTurn(view) && isTurn(shown)) {
      const dir = view === "back" ? 1 : -1;
      gsap.to(el, {
        rotationY: dir * 90,
        duration: 0.32,
        ease: "power2.in",
        overwrite: true,
        onComplete: () => {
          pending.current = { type: "flip", dir };
          setShown(view);
        },
      });
    } else {
      gsap.to(el, {
        autoAlpha: 0,
        scale: 0.97,
        duration: 0.25,
        overwrite: true,
        onComplete: () => {
          pending.current = { type: "wipe", dir: 1 };
          setShown(view);
        },
      });
    }
  }, [view, shown]);

  // in-animation after swap
  useLayoutEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    const el = inner.current!;
    if (p.type === "flip") {
      gsap.fromTo(el, { rotationY: -p.dir * 90 }, { rotationY: 0, duration: 0.6, ease: "power3.out", overwrite: true });
    } else {
      gsap.fromTo(
        el,
        { autoAlpha: 1, scale: 1.04, clipPath: "inset(100% 0% 0% 0%)" },
        { scale: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out", overwrite: true }
      );
    }
  }, [shown]);

  // variant swap flash
  useEffect(() => {
    if (!inner.current) return;
    gsap.fromTo(inner.current, { filter: "brightness(1.8) saturate(1.4)" }, { filter: "brightness(1) saturate(1)", duration: 0.6, ease: "power2.out" });
  }, [variant]);

  // pointer parallax on the stage
  useEffect(() => {
    const st = stage.current;
    if (!st || !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const media = st.querySelector(`.${styles.stageMedia}`);
    const xTo = gsap.quickTo(media, "x", { duration: 0.8, ease: "power3" });
    const yTo = gsap.quickTo(media, "y", { duration: 0.8, ease: "power3" });
    const move = (e: PointerEvent) => {
      const r = st.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - 0.5) * -24);
      yTo(((e.clientY - r.top) / r.height - 0.5) * -24);
    };
    const leave = () => (xTo(0), yTo(0));
    st.addEventListener("pointermove", move);
    st.addEventListener("pointerleave", leave);
    return () => {
      st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerleave", leave);
    };
  }, []);

  // keep the mobile carousel in sync with view changes (e.g. picking a back print)
  useEffect(() => {
    const el = swipe.current;
    if (!el || el.offsetParent === null) return;
    const i = GALLERY.findIndex((g) => g.kind === view);
    el.scrollTo({ left: i * el.clientWidth, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [view]);

  const onSwipe = () => {
    const el = swipe.current;
    if (!el) return;
    setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  const shownIndex = GALLERY.findIndex((g) => g.kind === shown);

  return (
    <div className={styles.gallery}>
      {/* desktop */}
      <div className={styles.thumbs} role="tablist" aria-label="Product images" aria-orientation="vertical">
        {GALLERY.map((g) => (
          <button
            key={g.kind}
            type="button"
            role="tab"
            aria-selected={view === g.kind}
            aria-label={g.label}
            className={styles.thumb}
            onClick={() => setView(g.kind)}
          >
            <ProductVisual product={product} kind={g.kind} variant={variant} tag={false} sizes="90px" />
          </button>
        ))}
      </div>

      <div className={styles.stageCol}>
        <div className={styles.stageWrap} data-stage>
          <button
            ref={stage}
            type="button"
            className={styles.stage}
            onClick={() => onZoom(shownIndex)}
            data-cursor="Zoom"
            aria-label={`Zoom ${GALLERY[shownIndex].label.toLowerCase()} image`}
          >
            <div className={styles.stageMedia}>
              <div ref={inner} className={styles.stageInner}>
                <ProductVisual product={product} kind={shown} variant={variant} priority tag={false} sizes="(max-width: 900px) 100vw, 55vw" />
              </div>
            </div>
          </button>
          {!getImage(product, shown, variant).src && (
            <span className={`${styles.renderTag} tag ${product.world === "nightshift" ? "tag--blue" : ""}`}>
              {shown === "model" ? "Lookbook · campaign shoot pending" : "Render · photo pending"}
            </span>
          )}
          <div className={styles.turnCtl} role="group" aria-label="Turn the hoodie">
            <span className={styles.turnPill} data-pos={view === "back" ? "back" : view === "front" ? "front" : "none"} aria-hidden="true" />
            <button type="button" className="mono" aria-pressed={view === "front"} onClick={() => setView("front")}>
              Front
            </button>
            <button type="button" className="mono" aria-pressed={view === "back"} onClick={() => setView("back")}>
              Back ↻
            </button>
          </div>
          <span className={`${styles.counter} mono`} aria-hidden="true">
            {String(shownIndex + 1).padStart(2, "0")} / {String(GALLERY.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* mobile */}
      <div className={styles.swipeWrap}>
        <div ref={swipe} className={styles.swipe} onScroll={onSwipe} aria-label="Product images, swipe for more" tabIndex={0}>
          {GALLERY.map((g, i) => (
            <button key={g.kind} type="button" className={styles.slide} onClick={() => onZoom(i)} aria-label={`Zoom ${g.label.toLowerCase()} image`}>
              <ProductVisual product={product} kind={g.kind} variant={variant} priority={i === 0} sizes="100vw" />
            </button>
          ))}
        </div>
        <div className={styles.dots} aria-hidden="true">
          {GALLERY.map((g, i) => (
            <span key={g.kind} data-on={slide === i || undefined} />
          ))}
          <span className={`${styles.slideLabel} mono`}>{GALLERY[slide]?.label}</span>
        </div>
      </div>
    </div>
  );
}
