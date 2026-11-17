"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTemplate, saveTemplate } from "@/server/admin";
import { SIZES, type Size } from "@/data/products";
import type { Category, CustomTemplate, PrintRect, Side, TemplateColor, TemplateView } from "@/data/schema";
import { UploadField } from "./UploadField";
import styles from "./Admin.module.css";

const SIDE = { front: "Front", back: "Back" } as const;

export function TemplateEditor({ initial, categories, isNew }: { initial: CustomTemplate; categories: Category[]; isNew?: boolean }) {
  const router = useRouter();
  const [t, setT] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const set = (p: Partial<CustomTemplate>) => {
    setSaved(false);
    setT((s) => ({ ...s, ...p }));
  };
  const setView = (side: Side, p: Partial<TemplateView>) => set({ views: t.views.map((v) => (v.side === side ? { ...v, ...p } : v)) });
  const toggleSize = (s: Size) => set({ sizes: t.sizes.includes(s) ? t.sizes.filter((x) => x !== s) : SIZES.filter((x) => x === s || t.sizes.includes(x)) });

  const save = () => {
    setError(null);
    start(async () => {
      const res = await saveTemplate({ ...t, originalId: isNew ? undefined : initial.id });
      if (!res.ok) return setError(res.error);
      setSaved(true);
      if (isNew || res.id !== initial.id) router.replace(`/admin/customizer/${res.id}`);
      else router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className={styles.split}>
        <div className={styles.stack}>
          {(["front", "back"] as Side[]).map((side) => {
            const v = t.views.find((x) => x.side === side)!;
            const heightCm = Math.round(((v.printWidthCm * (v.area.h * v.mockupH)) / (v.area.w * v.mockupW)) * 10) / 10;
            return (
              <section key={side} className={styles.card}>
                <div className={styles.head} style={{ marginBottom: 12 }}>
                  <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                    {SIDE[side]} side
                  </h2>
                  <label className={styles.check}>
                    <input type="checkbox" checked={v.enabled} onChange={(e) => setView(side, { enabled: e.target.checked })} />
                    Customers can print here
                  </label>
                </div>
                {v.enabled && (
                  <div className={styles.grid2}>
                    <div className={styles.stack}>
                      <span className={styles.label}>Print area: drag the box, resize from the corner</span>
                      {v.mockup ? (
                        <AreaEditor src={v.mockup} area={v.area} onChange={(area) => setView(side, { area })} />
                      ) : (
                        <p className={styles.muted}>Upload a mockup first.</p>
                      )}
                    </div>
                    <div className={styles.stack}>
                      <UploadField
                        label="Mockup (blank garment)"
                        value={v.mockup || undefined}
                        hint="Transparent PNG of the blank garment, white or light grey. Used to place the print area, and tinted for colours without their own photo."
                        onChange={(url, size) => setView(side, { mockup: url ?? "", ...(size ? { mockupW: size.w, mockupH: size.h } : {}) })}
                      />
                      <div className={styles.grid2}>
                        <label className={styles.field}>
                          <span>Print width (cm)</span>
                          <input type="number" min={1} step="0.5" value={v.printWidthCm} onChange={(e) => setView(side, { printWidthCm: Number(e.target.value) })} />
                          <small>Height: {heightCm} cm</small>
                        </label>
                        <label className={styles.field}>
                          <span>Extra price</span>
                          <input type="number" min={0} step="0.01" value={v.printPrice} onChange={(e) => setView(side, { printPrice: Number(e.target.value) })} />
                          <small>Added when this side is printed</small>
                        </label>
                      </div>
                      <div className={styles.grid2}>
                        {(["x", "y", "w", "h"] as (keyof PrintRect)[]).map((k) => (
                          <label key={k} className={styles.field}>
                            <span>{{ x: "Left", y: "Top", w: "Width", h: "Height" }[k]} (%)</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step="0.5"
                              value={Math.round(v.area[k] * 1000) / 10}
                              onChange={(e) => setView(side, { area: { ...v.area, [k]: Number(e.target.value) / 100 } })}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          <section className={styles.card}>
            <h2>Colours</h2>
            <p className={styles.muted} style={{ marginBottom: 14 }}>
              Customers pick from these. Give each colour a photo of the blank garment in that colour (same framing as the mockup above) for the most
              realistic preview. A colour without a photo uses the mockup, tinted.
            </p>
            {t.colors.map((c, i) => {
              const setColor = (p: Partial<TemplateColor>) => set({ colors: t.colors.map((x, j) => (j === i ? { ...x, ...p } : x)) });
              return (
                <div key={i} className={styles.colorBlock}>
                  <div className={styles.colorRow}>
                    <input value={c.name} onChange={(e) => setColor({ name: e.target.value })} placeholder="Colour name" aria-label="Colour name" />
                    <input type="color" value={c.hex} onChange={(e) => setColor({ hex: e.target.value })} aria-label={`${c.name} colour`} />
                    <button type="button" className={`${styles.btnDanger} ${styles.btnSm}`} onClick={() => set({ colors: t.colors.filter((_, j) => j !== i) })} disabled={t.colors.length < 2}>
                      Remove
                    </button>
                  </div>
                  <div className={styles.grid2}>
                    {t.views
                      .filter((v) => v.enabled)
                      .map((v) => (
                        <UploadField
                          key={v.side}
                          label={`${SIDE[v.side]} photo${c.name ? ` (${c.name})` : ""}`}
                          value={c.photos?.[v.side]}
                          onChange={(url) => setColor({ photos: { ...c.photos, [v.side]: url } })}
                        />
                      ))}
                  </div>
                </div>
              );
            })}
            <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => set({ colors: [...t.colors, { id: "", name: "", hex: "#ffffff" }] })}>
              + Add colour
            </button>
            <label className={styles.check} style={{ marginTop: 14 }}>
              <input type="checkbox" checked={t.tint} onChange={(e) => set({ tint: e.target.checked })} />
              Tint the mockup for colours that have no photo of their own
            </label>
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.card}>
            <h2>Base</h2>
            <div className={styles.stack}>
              <label className={styles.check}>
                <input type="checkbox" checked={t.active} onChange={(e) => set({ active: e.target.checked })} />
                Available in the customizer
              </label>
              <label className={styles.field}>
                <span>Name</span>
                <input value={t.name} onChange={(e) => set({ name: e.target.value })} required placeholder="Custom Sweatpants" />
              </label>
              <label className={styles.field}>
                <span>Category</span>
                <select value={t.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Description</span>
                <textarea rows={2} value={t.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Base price</span>
                <input type="number" min={0} step="0.01" value={t.basePrice} onChange={(e) => set({ basePrice: Number(e.target.value) })} />
                <small>Price = base + extra price of each printed side.</small>
              </label>
              <div className={styles.field}>
                <span>Sizes</span>
                <div className={styles.chips}>
                  {SIZES.map((s) => (
                    <label key={s} className={styles.chip}>
                      <input type="checkbox" checked={t.sizes.includes(s)} onChange={() => toggleSize(s)} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <label className={styles.field}>
                <span>Sort order</span>
                <input type="number" value={t.order} onChange={(e) => set({ order: Number(e.target.value) })} />
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className={styles.saveBar}>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? "Saving…" : isNew ? "Create" : "Save changes"}
          </button>
          {saved && <span className={styles.success}>Saved</span>}
          {error && <span className={styles.error}>{error}</span>}
        </div>
        {!isNew && (
          <button
            type="button"
            className={styles.btnDanger}
            disabled={pending}
            onClick={() => {
              if (window.confirm(`Delete “${initial.name}”? Past orders keep their designs.`)) start(() => deleteTemplate(initial.id));
            }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

/** Drag/resize the print rectangle on top of the mockup. */
function AreaEditor({ src, area, onChange }: { src: string; area: PrintRect; onChange: (a: PrintRect) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: "move" | "size"; sx: number; sy: number; a: PrintRect } | null>(null);
  const latest = useRef(onChange);
  latest.current = onChange;

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const dx = (e.clientX - d.sx) / r.width;
      const dy = (e.clientY - d.sy) / r.height;
      const c = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
      const round = (v: number) => Math.round(v * 1000) / 1000;
      if (d.mode === "move") {
        latest.current({ ...d.a, x: round(c(d.a.x + dx, 0, 1 - d.a.w)), y: round(c(d.a.y + dy, 0, 1 - d.a.h)) });
      } else {
        latest.current({ ...d.a, w: round(c(d.a.w + dx, 0.03, 1 - d.a.x)), h: round(c(d.a.h + dy, 0.03, 1 - d.a.y)) });
      }
    };
    const up = () => (drag.current = null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const begin = (mode: "move" | "size") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { mode, sx: e.clientX, sy: e.clientY, a: area };
  };

  return (
    <div ref={ref} className={styles.areaStage}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
      <div
        className={styles.areaBox}
        style={{ left: `${area.x * 100}%`, top: `${area.y * 100}%`, width: `${area.w * 100}%`, height: `${area.h * 100}%` }}
        onPointerDown={begin("move")}
      >
        <span className={styles.areaHandle} onPointerDown={begin("size")} />
      </div>
    </div>
  );
}
