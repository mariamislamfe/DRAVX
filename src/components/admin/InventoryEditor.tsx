"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveInventory } from "@/server/admin";
import type { Size } from "@/data/products";
import styles from "./Admin.module.css";

export type InventoryRow = {
  /** slug, or slug|colourId for products in several colours */
  key: string;
  slug: string;
  name: string;
  color?: { name: string; hex: string };
  category: string;
  image?: string;
  active: boolean;
  sizes: Size[];
  soldOut: Size[];
  stock: Partial<Record<Size, number>>;
};

const LOW = 3;

export function InventoryEditor({ rows }: { rows: InventoryRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  // text values so an empty box means "not tracked"
  const initial = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.key, Object.fromEntries(r.sizes.map((s) => [s, r.stock[s] === undefined ? "" : String(r.stock[s])]))])),
    [rows]
  );
  const [values, setValues] = useState<Record<string, Record<string, string>>>(initial);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const level = (r: InventoryRow, s: Size): "out" | "low" | "ok" | "free" => {
    const v = values[r.key]?.[s] ?? "";
    if (v === "") return r.soldOut.includes(s) ? "out" : "free";
    const n = Number(v);
    return n <= 0 ? "out" : n <= LOW ? "low" : "ok";
  };
  const shown = rows.filter((r) => filter === "all" || r.sizes.some((s) => level(r, s) === filter || (filter === "low" && level(r, s) === "out")));
  const lowCount = rows.filter((r) => r.sizes.some((s) => ["low", "out"].includes(level(r, s)))).length;
  const outCount = rows.filter((r) => r.sizes.some((s) => level(r, s) === "out")).length;

  const set = (key: string, size: Size, v: string) => {
    setMsg(null);
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], [size]: v.replace(/[^\d]/g, "").slice(0, 6) } }));
  };

  const save = () => {
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, row]) => [key, Object.fromEntries(Object.entries(row).map(([s, v]) => [s, v === "" ? null : Number(v)]))])
    );
    start(async () => {
      await saveInventory(payload);
      setMsg("Stock saved");
      router.refresh();
    });
  };

  return (
    <>
      <div className={styles.filters}>
        <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"}>
          All · {rows.length}
        </button>
        <button type="button" onClick={() => setFilter("low")} aria-pressed={filter === "low"}>
          Low stock · {lowCount}
        </button>
        <button type="button" onClick={() => setFilter("out")} aria-pressed={filter === "out"}>
          Sold out · {outCount}
        </button>
      </div>

      {shown.length === 0 ? (
        <p className={`${styles.card} ${styles.empty}`}>Nothing here.</p>
      ) : (
        <ul className={styles.invList}>
          {shown.map((r) => (
            <li key={r.key} className={styles.invRow}>
              <div className={styles.invProduct}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.image ? <img src={r.image} alt="" className={styles.thumb} /> : <span className={styles.thumb} />}
                <div>
                  <Link href={`/admin/products/${r.slug}`} className={styles.rowLink}>
                    {r.name}
                  </Link>
                  <div className={styles.muted}>
                    {r.color && (
                      <>
                        <span className={styles.swatch} style={{ background: r.color.hex }} />
                        {r.color.name} ·{" "}
                      </>
                    )}
                    {r.category}
                    {!r.active && " · hidden"}
                  </div>
                </div>
              </div>
              <div className={styles.invSizes}>
                {r.sizes.map((s) => (
                  <label key={s} className={styles.invCell} data-level={level(r, s)}>
                    <span>{s}</span>
                    <input
                      inputMode="numeric"
                      value={values[r.key]?.[s] ?? ""}
                      onChange={(e) => set(r.key, s, e.target.value)}
                      placeholder={r.soldOut.includes(s) ? "out" : "∞"}
                      aria-label={`${r.name}${r.color ? ` ${r.color.name}` : ""} size ${s} stock`}
                    />
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.saveBar}>
        <p className={styles.muted} style={{ fontSize: "0.85rem" }}>
          Empty box = not tracked. Tracked sizes sell out at 0 and go down with every order.
        </p>
        <div className={styles.actions}>
          {msg && !dirty && <span className={styles.success}>{msg}</span>}
          <button type="button" className={styles.btn} onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save stock"}
          </button>
        </div>
      </div>
    </>
  );
}
