"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { SIZES } from "@/data/products";
import { lockScroll } from "@/components/motion/SmoothScroll";
import styles from "./Pdp.module.css";

// PLACEHOLDER measurements (cm) — replace with production spec sheet.
const CHART = {
  chest: [60, 63, 66, 69, 72, 75], // flat chest width
  length: [68, 70, 72, 74, 76, 78], // body length (HPS)
  sleeve: [84, 86, 88, 90, 92, 94], // centre back to cuff
};

export function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const fmt = (cm: number) => (unit === "cm" ? cm : Math.round((cm / 2.54) * 10) / 10);

  useEffect(() => {
    const el = ref.current!;
    if (open) {
      lockScroll(true);
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(el.firstElementChild, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
      gsap.fromTo(el.lastElementChild, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "power4.out" });
      setTimeout(() => el.querySelector<HTMLElement>("button")?.focus(), 30);
      const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", esc);
      return () => window.removeEventListener("keydown", esc);
    } else if (el.style.visibility === "visible") {
      lockScroll(false);
      gsap.to(el.lastElementChild, { yPercent: 100, duration: 0.4, ease: "power3.in" });
      gsap.to(el.firstElementChild, { autoAlpha: 0, duration: 0.4, onComplete: () => void gsap.set(el, { visibility: "hidden" }) });
    }
  }, [open, onClose]);

  return (
    <div ref={ref} className={styles.modalRoot} aria-hidden={!open} inert={!open}>
      <div className={styles.modalScrim} onClick={onClose} />
      <div className={`${styles.sheet} on-paper`} role="dialog" aria-modal="true" aria-labelledby="sg-title" data-lenis-prevent>
        <div className={styles.sheetHead}>
          <h2 id="sg-title" className="display">
            Size guide
          </h2>
          <button type="button" className="mono link-u" onClick={onClose}>
            Close
          </button>
        </div>
        <p className={styles.sheetLede}>
          Cut oversized with dropped shoulders. Take your usual size for the intended slouch, or size down for a closer fit.
        </p>
        <div className={styles.unit} role="group" aria-label="Units">
          {(["cm", "in"] as const).map((u) => (
            <button key={u} type="button" className="mono" aria-pressed={unit === u} onClick={() => setUnit(u)}>
              {u}
            </button>
          ))}
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">Garment measurements in {unit}</caption>
            <thead>
              <tr>
                <th scope="col" className="mono">Size</th>
                {SIZES.map((s) => (
                  <th key={s} scope="col" className="mono">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Chest (flat)", CHART.chest],
                  ["Body length", CHART.length],
                  ["Sleeve", CHART.sleeve],
                ] as const
              ).map(([label, row]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {row.map((v, i) => (
                    <td key={i}>{fmt(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`${styles.sheetNote} mono`}>Placeholder measurements, to be confirmed against the production spec sheet.</p>
      </div>
    </div>
  );
}
