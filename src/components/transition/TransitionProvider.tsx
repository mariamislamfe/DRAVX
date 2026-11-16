"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { useUI } from "@/lib/store";
import { scrollToTop } from "@/components/motion/SmoothScroll";
import styles from "./Transition.module.css";

export type TransitionTone = "ink" | "paper" | "blue" | "concrete";
export type NavigateOptions = { label?: string; tone?: TransitionTone };

const Ctx = createContext<{ navigate: (href: string, opts?: NavigateOptions) => void }>({
  navigate: () => {},
});
export const useTransitionNav = () => useContext(Ctx);

const LABELS: [RegExp, string][] = [
  [/^\/$/, "DRAVX"],
  [/^\/shop/, "The Drop"],
  [/^\/about/, "Manifesto"],
  [/^\/cart/, "Your Bag"],
  [/^\/checkout/, "Checkout"],
];

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pending = useRef<string | null>(null);
  const safety = useRef<number | null>(null);
  const [opts, setOpts] = useState<NavigateOptions>({});

  const reveal = useCallback(() => {
    const el = overlay.current;
    if (!el) return;
    if (safety.current) window.clearTimeout(safety.current);
    const panels = el.querySelectorAll("[data-panel]");
    useUI.getState().setPhase("ready");
    gsap
      .timeline({ onComplete: () => gsap.set(el, { visibility: "hidden" }) })
      .to(labelRef.current, { yPercent: -120, duration: 0.45, ease: "power3.in" })
      .to(panels, { scaleY: 0, transformOrigin: "50% 0%", duration: 0.75, stagger: 0.06, ease: "power4.inOut" }, "-=0.15");
  }, []);

  const navigate = useCallback(
    (href: string, o: NavigateOptions = {}) => {
      const url = new URL(href, window.location.href);
      const ui = useUI.getState();
      ui.setCartOpen(false);
      ui.setMenuOpen(false);
      if (url.origin !== window.location.origin) {
        window.location.href = href;
        return;
      }
      if (url.pathname === window.location.pathname) {
        if (url.search !== window.location.search) router.push(href, { scroll: false });
        else scrollToTop(false);
        return;
      }
      if (pending.current) return;
      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }
      pending.current = url.pathname;
      setOpts({ label: o.label ?? LABELS.find(([r]) => r.test(url.pathname))?.[1] ?? "DRAVX", tone: o.tone ?? "ink" });
      ui.setPhase("transitioning");
      const el = overlay.current!;
      const panels = el.querySelectorAll("[data-panel]");
      gsap
        .timeline({ onComplete: () => router.push(href) })
        .set(el, { visibility: "visible" })
        .fromTo(
          panels,
          { scaleY: 0, transformOrigin: "50% 100%" },
          { scaleY: 1, duration: 0.65, stagger: 0.06, ease: "power4.inOut" }
        )
        .fromTo(labelRef.current, { yPercent: 120 }, { yPercent: 0, duration: 0.55, ease: "power3.out" }, "-=0.3");
      // never leave the user stuck behind the curtain
      safety.current = window.setTimeout(() => {
        if (pending.current) {
          pending.current = null;
          reveal();
        }
      }, 5000);
    },
    [router, reveal]
  );

  useEffect(() => {
    if (!pending.current) return;
    pending.current = null;
    scrollToTop(true);
    // let the new page lay out before measuring triggers
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      reveal();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname, reveal]);

  return (
    <Ctx.Provider value={{ navigate }}>
      {children}
      <div ref={overlay} className={styles.overlay} data-tone={opts.tone ?? "ink"} aria-hidden="true">
        <div className={styles.panels}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} data-panel className={styles.panel} />
          ))}
        </div>
        <div className={styles.labelWrap}>
          <span ref={labelRef} className={`${styles.label} display`}>
            {opts.label}
          </span>
        </div>
      </div>
    </Ctx.Provider>
  );
}
