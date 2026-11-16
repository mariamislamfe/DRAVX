"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import styles from "./Marquee.module.css";

/** Infinite ticker whose speed + skew react to scroll velocity. */
export function Marquee({ items, tone = "blue" }: { items: string[]; tone?: "blue" | "paper" | "orange" }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const track = root.current!.querySelector(`.${styles.track}`)!;
      const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 28, repeat: -1 });
      const skew = gsap.quickTo(track, "skewX", { duration: 0.5, ease: "power3" });
      let boost = 0;
      let dir = 1;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = self.getVelocity();
          dir = self.direction || dir;
          boost = Math.min(Math.abs(v) / 280, 5);
          skew(gsap.utils.clamp(-8, 8, v / -220));
        },
      });
      // velocity decays back to cruising speed when scrolling stops
      const tick = () => {
        boost *= 0.92;
        loop.timeScale(dir * (1 + boost));
        if (boost > 0 && boost < 0.02) {
          boost = 0;
          skew(0);
        }
      };
      gsap.ticker.add(tick);
      return () => {
        st.kill();
        gsap.ticker.remove(tick);
      };
    },
    { scope: root }
  );

  const row = (hidden: boolean) =>
    items.map((t, i) => (
      <span key={`${hidden}-${i}`} className={styles.item} aria-hidden={hidden || undefined}>
        {t}
        <span className={styles.star} aria-hidden="true">
          ✳
        </span>
      </span>
    ));

  return (
    <div ref={root} className={styles.marquee} data-tone={tone}>
      <p className="sr-only">{items.join(". ")}</p>
      <div className={`${styles.track} display`} aria-hidden="true">
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}
