"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { Product } from "@/data/products";
import { ProductVisual } from "@/components/product/ProductVisual";
import { GALLERY } from "./Gallery";
import { lockScroll } from "@/components/motion/SmoothScroll";
import styles from "./Pdp.module.css";

/**
 * Full-screen zoom. Click/tap toggles 2.4× zoom at the pointer, then the
 * image pans with the pointer (mouse) or finger drag (touch).
 */
export function Lightbox({
  product,
  variant,
  index,
  onClose,
  onIndex,
}: {
  product: Product;
  variant?: string;
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const open = index !== null;

  useEffect(() => {
    const el = root.current!;
    if (open) {
      lockScroll(true);
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(el, { clipPath: "inset(50% 50% 50% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.out" });
      setTimeout(() => el.querySelector<HTMLElement>("[data-close]")?.focus(), 30);
    } else if (el.style.visibility === "visible") {
      lockScroll(false);
      setZoomed(false);
      gsap.to(el, { clipPath: "inset(50% 50% 50% 50%)", duration: 0.5, ease: "power3.in", onComplete: () => void gsap.set(el, { visibility: "hidden" }) });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(((index ?? 0) + 1) % GALLERY.length);
      if (e.key === "ArrowLeft") onIndex(((index ?? 0) - 1 + GALLERY.length) % GALLERY.length);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, index, onClose, onIndex]);

  useEffect(() => {
    setZoomed(false);
    if (img.current) gsap.fromTo(img.current, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out" });
  }, [index]);

  useEffect(() => {
    if (img.current) gsap.to(img.current, { scale: zoomed ? 2.4 : 1, duration: 0.6, ease: "power3.out" });
  }, [zoomed]);

  const setOrigin = (x: number, y: number) => {
    const r = img.current!.parentElement!.getBoundingClientRect();
    const ox = ((x - r.left) / r.width) * 100;
    const oy = ((y - r.top) / r.height) * 100;
    gsap.to(img.current, { transformOrigin: `${ox}% ${oy}%`, duration: 0.4, ease: "power2.out" });
  };

  const i = index ?? 0;
  const g = GALLERY[i];

  return (
    <div ref={root} className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Image zoom" aria-hidden={!open} inert={!open} data-world={product.world}>
      <div
        className={styles.lbStage}
        onClick={(e) => {
          setOrigin(e.clientX, e.clientY);
          setZoomed((z) => !z);
        }}
        onPointerMove={(e) => zoomed && setOrigin(e.clientX, e.clientY)}
        data-cursor={zoomed ? "Out" : "Zoom"}
        style={{ touchAction: zoomed ? "none" : "auto" }}
      >
        <div ref={img} className={styles.lbImg}>
          {open && <ProductVisual product={product} kind={g.kind} variant={variant} sizes="100vw" />}
        </div>
      </div>
      <div className={styles.lbBar}>
        <span className="mono">
          {String(i + 1).padStart(2, "0")} / {String(GALLERY.length).padStart(2, "0")} — {g.label}
        </span>
        <div className={styles.lbNav}>
          <button type="button" className="mono" onClick={() => onIndex((i - 1 + GALLERY.length) % GALLERY.length)} aria-label="Previous image">
            ← Prev
          </button>
          <button type="button" className="mono" onClick={() => onIndex((i + 1) % GALLERY.length)} aria-label="Next image">
            Next →
          </button>
          <button type="button" className="mono" onClick={onClose} data-close>
            Close ✕
          </button>
        </div>
      </div>
    </div>
  );
}
