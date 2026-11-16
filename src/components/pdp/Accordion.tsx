"use client";

import { useRef, useState, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import styles from "./Pdp.module.css";

type Item = { id: string; title: string; content: ReactNode; open?: boolean };

export function Accordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((i) => [i.id, !!i.open])));
  const panels = useRef<Record<string, HTMLDivElement | null>>({});

  const toggle = (id: string) => {
    const next = !open[id];
    setOpen((o) => ({ ...o, [id]: next }));
    const el = panels.current[id];
    if (!el) return;
    if (next) gsap.fromTo(el, { height: 0 }, { height: "auto", duration: 0.55, ease: "power3.out" });
    else gsap.fromTo(el, { height: el.offsetHeight }, { height: 0, duration: 0.45, ease: "power3.inOut" });
  };

  return (
    <div className={styles.acc}>
      {items.map((it) => (
        <div key={it.id} className={styles.accItem}>
          <h3>
            <button
              type="button"
              className={`${styles.accBtn} mono`}
              aria-expanded={open[it.id]}
              aria-controls={`acc-${it.id}`}
              id={`accb-${it.id}`}
              onClick={() => toggle(it.id)}
            >
              {it.title}
              <span className={styles.accIcon} aria-hidden="true" />
            </button>
          </h3>
          <div
            ref={(el) => {
              panels.current[it.id] = el;
            }}
            id={`acc-${it.id}`}
            role="region"
            aria-labelledby={`accb-${it.id}`}
            className={styles.accPanel}
            style={{ height: it.open ? "auto" : 0 }}
          >
            <div className={styles.accBody}>{it.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
