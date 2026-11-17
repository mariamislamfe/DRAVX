"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useUI } from "@/lib/store";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Garment } from "@/components/product/Garment";
import { useCatalog } from "@/lib/catalog";
import { socialUrl } from "@/config/brand";
import { NAV } from "./Header";
import styles from "./MobileMenu.module.css";

export function MobileMenu() {
  const open = useUI((s) => s.menuOpen);
  const setOpen = useUI((s) => s.setMenuOpen);
  const ref = useRef<HTMLDivElement>(null);
  const { products: all, settings } = useCatalog();
  const products = all.slice(0, 3);
  const brand = settings.brand;
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = ref.current!;
    tl.current = gsap
      .timeline({ paused: true })
      .set(el, { visibility: "visible" })
      .fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "power4.inOut" })
      .from(el.querySelectorAll("[data-item]"), { yPercent: 110, stagger: 0.06, duration: 0.7, ease: "power4.out" }, "-=0.3")
      .from(el.querySelectorAll("[data-fade]"), { autoAlpha: 0, y: 12, stagger: 0.05, duration: 0.5 }, "-=0.5");
    return () => {
      tl.current?.kill();
    };
  }, []);

  useEffect(() => {
    if (open) tl.current?.timeScale(1).play();
    else tl.current?.timeScale(1.6).reverse();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, setOpen]);

  return (
    <div ref={ref} id="mobile-menu" className={styles.menu} aria-hidden={!open} inert={!open}>
      <nav aria-label="Mobile">
        <ul className={styles.list}>
          {NAV.map((n, i) => (
            <li key={n.href} className="mask">
              <TransitionLink href={n.href} data-item className={`${styles.link} display`}>
                <span className={`${styles.idx} mono`}>0{i + 1}</span>
                {n.label}
              </TransitionLink>
            </li>
          ))}
          <li className="mask">
            <TransitionLink href="/cart" data-item className={`${styles.link} display`}>
              <span className={`${styles.idx} mono`}>{String(NAV.length + 1).padStart(2, "0")}</span>
              Bag
            </TransitionLink>
          </li>
        </ul>
      </nav>
      <div className={styles.foot}>
        <div className={styles.renders} data-fade aria-hidden="true">
          {products.map((p) => (
            <Garment key={p.slug} product={p} view="back" decorative sizes="120px" />
          ))}
        </div>
        {brand.instagram && (
          <a className="mono" data-fade href={socialUrl("instagram", brand.instagram)} target="_blank" rel="noopener noreferrer">
            {brand.instagram.startsWith("http") ? "Instagram" : `@${brand.instagram.replace(/^@/, "")}`}
          </a>
        )}
        <p className="mono" data-fade style={{ opacity: 0.6 }}>
          {brand.tagline || "Front: quiet. Back: loud."}
        </p>
      </div>
    </div>
  );
}
