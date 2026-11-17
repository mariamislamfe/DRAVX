"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { SizeChart } from "@/data/schema";
import { lockScroll } from "@/components/motion/SmoothScroll";
import styles from "./Pdp.module.css";

/** Measurements come from Dashboard → Categories → Size guide (in cm). */
export function SizeGuide({ chart, open, onClose }: { chart: SizeChart; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  // numbers (and ranges like 60-62) convert; anything else is shown as typed
  const fmt = (v: string) =>
    unit === "cm" ? v : v.replace(/\d+(?:\.\d+)?/g, (n) => String(Math.round((Number(n) / 2.54) * 10) / 10));
  const numeric = chart.rows.some((r) => r.values.some((v) => /\d/.test(v)));

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
        {chart.intro && <p className={styles.sheetLede}>{chart.intro}</p>}
        {numeric && (
          <div className={styles.unit} role="group" aria-label="Units">
            {(["cm", "in"] as const).map((u) => (
              <button key={u} type="button" className="mono" aria-pressed={unit === u} onClick={() => setUnit(u)}>
                {u}
              </button>
            ))}
          </div>
        )}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">Garment measurements in {unit}</caption>
            <thead>
              <tr>
                <th scope="col" className="mono">
                  Size
                </th>
                {chart.sizes.map((s) => (
                  <th key={s} scope="col" className="mono">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {chart.sizes.map((s, i) => (
                    <td key={s}>{r.values[i] ? fmt(r.values[i]) : "–"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`${styles.sheetNote} mono`}>Garment measured flat, in {unit}.</p>
      </div>
    </div>
  );
}
