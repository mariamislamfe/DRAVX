"use client";

import { DEFAULT_SIZE_CHART, type SizeChart } from "@/data/schema";
import styles from "./Admin.module.css";

/** Editable size guide: sizes across, measurements down, values in cm. */
export function SizeChartEditor({ value, onChange }: { value?: SizeChart; onChange: (c: SizeChart | undefined) => void }) {
  if (!value) {
    return (
      <div className={styles.stack}>
        <p className={styles.muted}>No size guide. Product pages in this category won&apos;t show the “Size guide” link.</p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => onChange(structuredClone(DEFAULT_SIZE_CHART))}>
            + Add size guide (hoodie template)
          </button>
          <button
            type="button"
            className={`${styles.btnGhost} ${styles.btnSm}`}
            onClick={() => onChange({ intro: "", sizes: ["S", "M", "L", "XL"], rows: [{ label: "Waist", values: ["", "", "", ""] }] })}
          >
            + Blank size guide
          </button>
        </div>
      </div>
    );
  }

  const c = value;
  const set = (p: Partial<SizeChart>) => onChange({ ...c, ...p });
  const setCell = (r: number, i: number, v: string) =>
    set({ rows: c.rows.map((row, j) => (j === r ? { ...row, values: c.sizes.map((_, k) => (k === i ? v : row.values[k] ?? "")) } : row)) });

  return (
    <div className={styles.stack}>
      <label className={styles.field}>
        <span>Intro (fit advice)</span>
        <textarea rows={2} value={c.intro} onChange={(e) => set({ intro: e.target.value })} placeholder="Cut oversized. Take your usual size…" />
      </label>

      <div className={styles.chartWrap}>
        <table className={styles.chart}>
          <thead>
            <tr>
              <th>Measurement (cm)</th>
              {c.sizes.map((s, i) => (
                <th key={i}>
                  <input
                    value={s}
                    aria-label={`Size ${i + 1}`}
                    onChange={(e) => set({ sizes: c.sizes.map((x, k) => (k === i ? e.target.value : x)) })}
                  />
                  <button
                    type="button"
                    className={styles.chartX}
                    aria-label={`Remove size ${s}`}
                    disabled={c.sizes.length < 2}
                    onClick={() => set({ sizes: c.sizes.filter((_, k) => k !== i), rows: c.rows.map((r) => ({ ...r, values: r.values.filter((_, k) => k !== i) })) })}
                  >
                    ×
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r, j) => (
              <tr key={j}>
                <th>
                  <input value={r.label} aria-label="Measurement name" onChange={(e) => set({ rows: c.rows.map((x, k) => (k === j ? { ...x, label: e.target.value } : x)) })} />
                  <button type="button" className={styles.chartX} aria-label={`Remove ${r.label}`} onClick={() => set({ rows: c.rows.filter((_, k) => k !== j) })}>
                    ×
                  </button>
                </th>
                {c.sizes.map((s, i) => (
                  <td key={i}>
                    <input value={r.values[i] ?? ""} inputMode="decimal" aria-label={`${r.label} ${s}`} onChange={(e) => setCell(j, i, e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.actions}>
        <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => set({ rows: [...c.rows, { label: "", values: c.sizes.map(() => "") }] })}>
          + Measurement
        </button>
        <button
          type="button"
          className={`${styles.btnGhost} ${styles.btnSm}`}
          disabled={c.sizes.length >= 12}
          onClick={() => set({ sizes: [...c.sizes, ""], rows: c.rows.map((r) => ({ ...r, values: [...r.values, ""] })) })}
        >
          + Size
        </button>
        <button type="button" className={`${styles.btnDanger} ${styles.btnSm}`} onClick={() => onChange(undefined)}>
          Remove size guide
        </button>
      </div>
      <small className={styles.muted}>Numbers in cm. Shoppers can switch to inches. Ranges like 60-62 work too.</small>
    </div>
  );
}
