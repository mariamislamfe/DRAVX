"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useUI } from "@/lib/store";
import { Logo } from "@/components/brand/Logo";
import styles from "./Preloader.module.css";

const KEY = "dravx-intro-seen";
// resolved once per page load so React strict-mode double effects don't skip the intro
let initialSeen: boolean | null = null;

export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const setPhase = useUI((s) => s.setPhase);

  useEffect(() => {
    const el = root.current!;
    const hide = () => gsap.set(el, { display: "none" });
    if (initialSeen === null) {
      initialSeen = false;
      try {
        initialSeen = sessionStorage.getItem(KEY) === "1";
        sessionStorage.setItem(KEY, "1");
      } catch {}
    }

    if (initialSeen || prefersReducedMotion()) {
      setPhase("ready");
      const t = gsap.to(el, { autoAlpha: 0, duration: 0.4, delay: 0.05, onComplete: hide });
      return () => {
        t.kill();
      };
    }

    const counter = { v: 0 };
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve();
    const words = el.querySelectorAll(`.${styles.word}`);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(
      el.querySelector(`.${styles.mark}`),
      { scale: 0.2, rotate: -120, autoAlpha: 0, color: "#2d6bff" },
      { scale: 1, rotate: 0, autoAlpha: 1, color: "#ebe7de", duration: 1.1, ease: "expo.out" }
    )
      .fromTo(
        el.querySelector(`.${styles.word2}`),
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power4.inOut" },
        0.35
      )
      .to(
        counter,
        {
          v: 100,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            if (count.current) count.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
          },
        },
        0.1
      )
      .fromTo(words, { yPercent: 100 }, { yPercent: 0, stagger: 0.45, duration: 0.4, ease: "power3.out" }, 0.2)
      .to(words, { yPercent: -100, stagger: 0.45, duration: 0.4, ease: "power3.in" }, 0.6)
      .add(() => setPhase("ready"), "+=0.05")
      .to(el.querySelector(`.${styles.top}`), { yPercent: -100, duration: 1, ease: "power4.inOut" }, "<")
      .to(el.querySelector(`.${styles.bottom}`), { yPercent: 100, duration: 1, ease: "power4.inOut" }, "<")
      .to(el.querySelector(`.${styles.content}`), { autoAlpha: 0, duration: 0.3 }, "<")
      .add(hide);

    let alive = true;
    fonts.then(() => {
      if (alive) tl.play();
    });
    return () => {
      alive = false;
      tl.revert();
    };
  }, [setPhase]);

  return (
    <div ref={root} className={styles.root} aria-hidden="true" data-preloader>
      <div className={styles.top} />
      <div className={styles.bottom} />
      <div className={styles.content}>
        <div className={styles.brand}>
          <Logo variant="mark" className={styles.mark} decorative />
          <Logo variant="wordmark" className={styles.word2} decorative />
        </div>
        <div className={`${styles.words} mono`}>
          <span className={styles.word}>Front: quiet</span>
          <span className={styles.word}>Back: loud</span>
        </div>
        <span ref={count} className={`${styles.count} display`}>
          000
        </span>
      </div>
    </div>
  );
}
