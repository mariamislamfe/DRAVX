"use client";

import { MAX_QTY } from "@/lib/store";
import styles from "./Cart.module.css";

export function QtyStepper({
  value,
  onChange,
  label = "Quantity",
  compact,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className={`${styles.stepper} ${compact ? styles.compact : ""}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        −
      </button>
      <output aria-live="polite" className="mono">
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= MAX_QTY} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
