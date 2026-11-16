"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useCart, useHydrated, useUI } from "@/lib/store";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { BRAND } from "@/config/brand";
import { Logo } from "@/components/brand/Logo";
import styles from "./Header.module.css";

export const NAV = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?world=daydream", label: "Daydream" },
  { href: "/shop?world=nightshift", label: "Nightshift" },
  { href: "/about", label: "Manifesto" },
];

export function Header() {
  const ref = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const { setCartOpen, menuOpen, setMenuOpen, bump } = useUI();

  // hide on scroll down, reveal on scroll up
  useEffect(() => {
    const el = ref.current!;
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const hidden = self.direction === 1 && self.scroll() > 140 && !useUI.getState().menuOpen;
        gsap.to(el, { yPercent: hidden ? -110 : 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
        el.dataset.scrolled = self.scroll() > 20 ? "1" : "0";
      },
    });
    return () => st.kill();
  }, []);

  useEffect(() => {
    gsap.to(ref.current, { yPercent: 0, duration: 0.4 });
  }, [pathname]);

  useEffect(() => {
    if (!bump || !countRef.current) return;
    gsap.fromTo(countRef.current, { scale: 1.9, backgroundColor: "#2d6bff" }, { scale: 1, backgroundColor: "rgba(0,0,0,0)", duration: 0.7, ease: "elastic.out(1, 0.45)" });
  }, [bump]);

  return (
    <header ref={ref} className={styles.header} data-menu={menuOpen ? "open" : "closed"}>
      <TransitionLink href="/" className={styles.logo} aria-label={`${BRAND.name} — home`} data-cursor="Home">
        <Logo variant="mark" height={26} decorative />
        <Logo variant="wordmark" height={17} decorative />
      </TransitionLink>

      <nav className={styles.nav} aria-label="Primary">
        {NAV.map((n) => (
          <TransitionLink key={n.href} href={n.href} className={`${styles.navLink} mono link-u`} aria-current={pathname === n.href ? "page" : undefined}>
            {n.label}
          </TransitionLink>
        ))}
      </nav>

      <div className={styles.actions}>
        <button type="button" className={`${styles.bag} mono`} onClick={() => setCartOpen(true)} aria-label={`Open bag, ${hydrated ? count : 0} items`} data-cart-target>
          Bag
          <span ref={countRef} className={styles.count}>
            {hydrated ? count : 0}
          </span>
        </button>
        <button
          type="button"
          className={`${styles.menuBtn} mono`}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={styles.menuLabel}>{menuOpen ? "Close" : "Menu"}</span>
          <span className={styles.burger} aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </div>
    </header>
  );
}
