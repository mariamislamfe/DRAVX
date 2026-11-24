"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCatalog, useText } from "@/lib/catalog";
import { Rich } from "@/components/brand/Rich";
import { track } from "@/lib/pixel";
import { useCart, useUI } from "@/lib/store";
import { formatPrice } from "@/config/brand";
import { mockupFor, templatePrice, type CustomDesign, type CustomSide, type CustomTemplate, type Side } from "@/data/schema";
import type { Size } from "@/data/products";
import { QtyStepper } from "@/components/cart/QtyStepper";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { drawMockup, exportSide, FONTS, upload, PRINT_DPI, type ImageLayer, type Layer, type SideExport, type TextLayer } from "@/lib/customize/render";
import styles from "./Customizer.module.css";

type Layers = Record<Side, Layer[]>;
type Drag =
  | { mode: "move"; id: string; sx: number; sy: number; ox: number; oy: number }
  | { mode: "scale"; id: string; cx: number; cy: number; d0: number; v0: number }
  | { mode: "rotate"; id: string; cx: number; cy: number; a0: number; r0: number };
type Review = { side: Side; exp: SideExport; preview: string }[];

const MAX_BYTES = 15 * 1024 * 1024;
const uid = () => Math.random().toString(36).slice(2, 10);
const SIDE_LABEL: Record<Side, string> = { front: "Front", back: "Back" };

export function Customizer() {
  const { templates } = useCatalog();
  const tx = useText();
  const [tid, setTid] = useState(templates[0]?.id);
  const t = templates.find((x) => x.id === tid) ?? templates[0];
  if (!t) {
    return (
      <div className={`${styles.page} on-paper`}>
        <div className="wrap">
          <h1 className={`${styles.title} display`}>
            <Rich text={tx("cz.closedTitle")} />
          </h1>
          <p>{tx("cz.closedText")}</p>
        </div>
      </div>
    );
  }
  return <Studio key={t.id} template={t} templates={templates} onTemplate={setTid} />;
}

function Studio({ template: t, templates, onTemplate }: { template: CustomTemplate; templates: CustomTemplate[]; onTemplate: (id: string) => void }) {
  const views = t.views.filter((v) => v.enabled);
  const tx = useText();
  const currency = useCatalog().settings.brand.currency;
  const [side, setSide] = useState<Side>(views.find((v) => v.side === "back")?.side ?? views[0].side);
  const view = views.find((v) => v.side === side) ?? views[0];
  const [layers, setLayers] = useState<Layers>({ front: [], back: [] });
  const [sel, setSel] = useState<string | null>(null);
  const [colorId, setColorId] = useState(t.colors[0]?.id);
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState<"preview" | "adding" | null>(null);
  const [added, setAdded] = useState(false);

  const add = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const canvas = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<Drag | null>(null);

  const color = t.colors.find((c) => c.id === colorId) ?? t.colors[0];
  const current = layers[side];
  const selected = current.find((l) => l.id === sel) ?? null;
  const usedSides = views.filter((v) => layers[v.side].length > 0).map((v) => v.side);
  const price = templatePrice(t, usedSides.length ? usedSides : []);
  const areaAspect = (view.area.h * view.mockupH) / (view.area.w * view.mockupW);
  const garmentSrc = mockupFor(view, color, t.tint);
  // stable identity so the canvas only redraws when the image or tint changes
  const garment = useMemo(() => garmentSrc, [garmentSrc.src, garmentSrc.tint]); // eslint-disable-line react-hooks/exhaustive-deps

  /* --- mockup canvas ---------------------------------------------------- */
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const draw = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      drawMockup(c.getContext("2d")!, garment, c.width, c.height).catch(() => setMsg("Couldn't load the garment mockup."));
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [garment]);

  /* --- layer helpers ---------------------------------------------------- */
  const patch = useCallback(
    (id: string, p: Partial<Layer>) =>
      setLayers((s) => ({ ...s, [side]: s[side].map((l) => (l.id === id ? ({ ...l, ...p } as Layer) : l)) })),
    [side]
  );
  const remove = (id: string) => {
    setLayers((s) => ({ ...s, [side]: s[side].filter((l) => l.id !== id) }));
    setSel(null);
  };
  const forward = (id: string) =>
    setLayers((s) => {
      const list = [...s[side]];
      const i = list.findIndex((l) => l.id === id);
      if (i < 0 || i === list.length - 1) return s;
      [list[i], list[i + 1]] = [list[i + 1], list[i]];
      return { ...s, [side]: list };
    });

  const onFiles = async (files: FileList | null) => {
    setMsg(null);
    for (const file of Array.from(files ?? [])) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        setMsg("Use a PNG, JPG or WebP image. PNG with a transparent background prints best.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setMsg("That image is over 15 MB.");
        continue;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      try {
        await img.decode();
      } catch {
        setMsg("Couldn't read that image.");
        continue;
      }
      const ratio = img.naturalHeight / img.naturalWidth;
      const w = Math.min(0.8, (0.8 * areaAspect) / ratio);
      const layer: ImageLayer = { id: uid(), type: "image", file, url, natW: img.naturalWidth, natH: img.naturalHeight, x: 0.5, y: 0.5, w, rot: 0 };
      setLayers((s) => ({ ...s, [side]: [...s[side], layer] }));
      setSel(layer.id);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const addText = () => {
    const dark = color ? luminance(color.hex) < 0.45 : false;
    const layer: TextLayer = { id: uid(), type: "text", text: "YOUR TEXT", color: dark ? "#ffffff" : "#0b0b0c", font: "display", x: 0.5, y: 0.3, size: 0.14, rot: 0 };
    setLayers((s) => ({ ...s, [side]: [...s[side], layer] }));
    setSel(layer.id);
  };

  /* --- pointer interactions -------------------------------------------- */
  const centerOf = (l: Layer) => {
    const r = areaRef.current!.getBoundingClientRect();
    return { cx: r.left + l.x * r.width, cy: r.top + l.y * r.height, r };
  };
  const begin = (e: React.PointerEvent, l: Layer, mode: Drag["mode"]) => {
    e.preventDefault();
    e.stopPropagation();
    setSel(l.id);
    const { cx, cy } = centerOf(l);
    if (mode === "move") drag.current = { mode, id: l.id, sx: e.clientX, sy: e.clientY, ox: l.x, oy: l.y };
    else if (mode === "scale") drag.current = { mode, id: l.id, cx, cy, d0: Math.hypot(e.clientX - cx, e.clientY - cy) || 1, v0: l.type === "image" ? l.w : l.size };
    else drag.current = { mode, id: l.id, cx, cy, a0: Math.atan2(e.clientY - cy, e.clientX - cx), r0: l.rot };
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      const area = areaRef.current;
      if (!d || !area) return;
      const r = area.getBoundingClientRect();
      const l = layers[side].find((x) => x.id === d.id);
      if (!l) return;
      if (d.mode === "move") {
        let x = d.ox + (e.clientX - d.sx) / r.width;
        let y = d.oy + (e.clientY - d.sy) / r.height;
        if (Math.abs(x - 0.5) < 0.015) x = 0.5; // snap to centre line
        if (Math.abs(y - 0.5) < 0.015) y = 0.5;
        patch(d.id, { x: clamp(x, -0.2, 1.2), y: clamp(y, -0.2, 1.2) });
      } else if (d.mode === "scale") {
        const v = d.v0 * (Math.hypot(e.clientX - d.cx, e.clientY - d.cy) / d.d0);
        patch(d.id, l.type === "image" ? { w: clamp(v, 0.04, 2) } : { size: clamp(v, 0.02, 1) });
      } else {
        let rot = d.r0 + ((Math.atan2(e.clientY - d.cy, e.clientX - d.cx) - d.a0) * 180) / Math.PI;
        rot = ((rot % 360) + 540) % 360 - 180;
        for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(rot - snap) < 4) rot = snap;
        patch(d.id, { rot: Math.round(rot) });
      }
    };
    const up = () => (drag.current = null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [layers, side, patch]);

  // keyboard nudging
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!selected || review) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const step = e.shiftKey ? 0.05 : 0.01;
      const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (map[e.key]) {
        e.preventDefault();
        patch(selected.id, { x: selected.x + map[e.key][0], y: selected.y + map[e.key][1] });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove(selected.id);
      } else if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  // release object URLs on unmount
  const all = useRef(layers);
  all.current = layers;
  useEffect(
    () => () => {
      [...all.current.front, ...all.current.back].forEach((l) => l.type === "image" && URL.revokeObjectURL(l.url));
    },
    []
  );

  /* --- print quality ---------------------------------------------------- */
  const dpiOf = (l: ImageLayer) => Math.round(l.natW / ((l.w * view.printWidthCm) / 2.54));
  const lowRes = current.filter((l): l is ImageLayer => l.type === "image" && dpiOf(l) < 100);

  /* --- review & add ------------------------------------------------------ */
  const startReview = async () => {
    setMsg(null);
    if (!usedSides.length) return setMsg("Add an image or some text first.");
    if (!size) return setMsg("Pick a size first.");
    setBusy("preview");
    setSel(null);
    try {
      const out: Review = [];
      for (const s of usedSides) {
        const v = views.find((x) => x.side === s)!;
        const exp = await exportSide(v, layers[s], mockupFor(v, color, t.tint), areaRef.current);
        out.push({ side: s, exp, preview: URL.createObjectURL(exp.mockup) });
      }
      setReview(out);
    } catch (e) {
      setMsg((e as Error).message || "Couldn't render the preview.");
    } finally {
      setBusy(null);
    }
  };

  const closeReview = () => {
    review?.forEach((r) => URL.revokeObjectURL(r.preview));
    setReview(null);
  };

  const confirm = async () => {
    if (!review || !size || !color) return;
    setBusy("adding");
    setMsg(null);
    try {
      const sides: CustomSide[] = [];
      const originals: string[] = [];
      for (const r of review) {
        for (const l of layers[r.side]) {
          if (l.type === "image") originals.push(await upload(l.file, l.file.name));
        }
        const [designUrl, mockupUrl] = await Promise.all([upload(r.exp.design, `${r.side}-design.png`), upload(r.exp.mockup, `${r.side}-mockup.png`)]);
        sides.push({
          side: r.side,
          designUrl,
          mockupUrl,
          areaWidthCm: r.exp.areaWidthCm,
          areaHeightCm: r.exp.areaHeightCm,
          artWidthCm: r.exp.artWidthCm,
          artHeightCm: r.exp.artHeightCm,
          artTopCm: r.exp.artTopCm,
          artLeftCm: r.exp.artLeftCm,
          dpi: r.exp.dpi,
          layers: layers[r.side].map((l) => ({ type: l.type, label: l.type === "image" ? l.file.name : `“${l.text}” · ${FONTS[l.font].label} · ${l.color}` })),
        });
      }
      const custom: CustomDesign = {
        templateId: t.id,
        templateName: t.name,
        colorId: color.id,
        colorName: color.name,
        colorHex: color.hex,
        sides,
        originals,
        note: note.trim() || undefined,
      };
      add({ slug: t.id, size, custom }, qty);
      track("AddToCart", { content_ids: [t.id], content_name: t.name, content_type: "product", value: price * qty, currency });
      closeReview();
      setAdded(true);
      setCartOpen(true);
    } catch (e) {
      setMsg((e as Error).message || "Upload failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const startOver = () => {
    [...layers.front, ...layers.back].forEach((l) => l.type === "image" && URL.revokeObjectURL(l.url));
    setLayers({ front: [], back: [] });
    setAdded(false);
    setSel(null);
    setNote("");
  };

  const mockAspect = `${view.mockupW} / ${view.mockupH}`;
  const areaStyle = useMemo(
    () => ({ left: `${view.area.x * 100}%`, top: `${view.area.y * 100}%`, width: `${view.area.w * 100}%`, height: `${view.area.h * 100}%` }),
    [view]
  );

  return (
    <div className={`${styles.page} on-paper`}>
      <div className={`${styles.layout} wrap`}>
        {/* ---------------- stage ---------------- */}
        <section className={styles.stageCol} aria-label="Design preview">
          <div className={styles.sideTabs} role="tablist" aria-label="Side">
            {views.map((v) => (
              <button
                key={v.side}
                type="button"
                role="tab"
                aria-selected={side === v.side}
                className={`${styles.sideTab} mono`}
                onClick={() => {
                  setSide(v.side);
                  setSel(null);
                }}
              >
                {SIDE_LABEL[v.side]}
                {layers[v.side].length > 0 && <i aria-label="has design" />}
              </button>
            ))}
          </div>

          <div className={styles.stage} style={{ aspectRatio: mockAspect, width: `min(100%, calc((100svh - var(--header-h) - 120px) * ${view.mockupW / view.mockupH}))` }} onPointerDown={() => setSel(null)}>
            <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
            <div ref={areaRef} className={styles.area} style={areaStyle} data-empty={current.length === 0 || undefined}>
              <div className={styles.clip}>
                {current.map((l) => (
                  <LayerView key={l.id} layer={l} onPointerDown={(e) => begin(e, l, "move")} />
                ))}
              </div>
              {selected && (
                <div
                  className={styles.frame}
                  style={{
                    left: `${selected.x * 100}%`,
                    top: `${selected.y * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${selected.rot}deg)`,
                    ...(selected.type === "image" ? { width: `${selected.w * 100}%`, aspectRatio: `${selected.natW} / ${selected.natH}` } : {}),
                  }}
                  onPointerDown={(e) => begin(e, selected, "move")}
                >
                  {selected.type === "text" && <TextBody layer={selected} ghost />}
                  <button type="button" className={`${styles.handle} ${styles.hScale}`} aria-label="Resize" onPointerDown={(e) => begin(e, selected, "scale")} />
                  <button type="button" className={`${styles.handle} ${styles.hRotate}`} aria-label="Rotate" onPointerDown={(e) => begin(e, selected, "rotate")} />
                  <button
                    type="button"
                    className={`${styles.handle} ${styles.hDelete}`}
                    aria-label="Remove layer"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => remove(selected.id)}
                  >
                    ×
                  </button>
                </div>
              )}
              {current.length === 0 && (
                <button type="button" className={`${styles.drop} mono`} onClick={() => fileRef.current?.click()} onPointerDown={(e) => e.stopPropagation()}>
                  + Add your design
                  <small>
                    {view.printWidthCm} × {Math.round(view.printWidthCm * areaAspect)} cm print area
                  </small>
                </button>
              )}
            </div>
          </div>
          <p className={`${styles.hint} mono`}>{tx("cz.hint")}</p>
        </section>

        {/* ---------------- panel ---------------- */}
        <aside className={styles.panel} aria-label="Customize options">
          <p className="mono">{tx("cz.kicker")}</p>
          <h1 className={`${styles.title} display`}>
            <Rich text={tx("cz.title")} />
          </h1>

          {templates.length > 1 && (
            <label className={styles.field}>
              <span className="mono">Base</span>
              <select value={t.id} onChange={(e) => onTemplate(e.target.value)}>
                {templates.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {t.description && <p className={styles.desc}>{t.description}</p>}

          <div className={styles.tools}>
            <button type="button" className="btn btn--ink" onClick={() => fileRef.current?.click()}>
              {tx("cz.upload")}
            </button>
            <button type="button" className="btn btn--ghost" onClick={addText}>
              {tx("cz.addText")}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          </div>

          {lowRes.length > 0 && (
            <p className={styles.warn} role="status">
              Low resolution: {lowRes.map((l) => `${l.file.name} (~${dpiOf(l)} dpi)`).join(", ")}. It may print blurry. Make it smaller or upload a bigger file.
            </p>
          )}

          {current.length > 0 && (
            <ol className={styles.layers} aria-label={`${SIDE_LABEL[side]} layers`}>
              {[...current].reverse().map((l) => (
                <li key={l.id} data-on={l.id === sel || undefined}>
                  <button type="button" className={styles.layerBtn} onClick={() => setSel(l.id)}>
                    <span className="mono">{l.type === "image" ? "IMG" : "TXT"}</span>
                    {l.type === "image" ? l.file.name : l.text || "(empty)"}
                  </button>
                </li>
              ))}
            </ol>
          )}

          {selected && (
            <div className={styles.inspector}>
              {selected.type === "text" && (
                <>
                  <label className={styles.field}>
                    <span className="mono">Text</span>
                    <textarea rows={2} value={selected.text} maxLength={80} onChange={(e) => patch(selected.id, { text: e.target.value })} />
                  </label>
                  <div className={styles.row2}>
                    <label className={styles.field}>
                      <span className="mono">Font</span>
                      <select value={selected.font} onChange={(e) => patch(selected.id, { font: e.target.value as TextLayer["font"] })}>
                        {Object.entries(FONTS).map(([k, f]) => (
                          <option key={k} value={k}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span className="mono">Colour</span>
                      <input type="color" value={selected.color} onChange={(e) => patch(selected.id, { color: e.target.value })} />
                    </label>
                  </div>
                </>
              )}
              <label className={styles.field}>
                <span className="mono">Size</span>
                <input
                  type="range"
                  min={selected.type === "image" ? 0.04 : 0.02}
                  max={selected.type === "image" ? 1.6 : 0.6}
                  step={0.005}
                  value={selected.type === "image" ? selected.w : selected.size}
                  onChange={(e) => patch(selected.id, selected.type === "image" ? { w: +e.target.value } : { size: +e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className="mono">Rotation · {selected.rot}°</span>
                <input type="range" min={-180} max={180} step={1} value={selected.rot} onChange={(e) => patch(selected.id, { rot: +e.target.value })} />
              </label>
              <div className={styles.inspActions}>
                <button type="button" className="mono link-u" onClick={() => patch(selected.id, { x: 0.5 })}>
                  Centre
                </button>
                <button type="button" className="mono link-u" onClick={() => forward(selected.id)}>
                  Bring forward
                </button>
                <button type="button" className="mono link-u" onClick={() => remove(selected.id)}>
                  Remove
                </button>
              </div>
            </div>
          )}

          <fieldset className={styles.field}>
            <legend className="mono">
              Colour <span>{color?.name}</span>
            </legend>
            <div className={styles.swatches}>
              {t.colors.map((c) => (
                <label key={c.id} className={styles.swatch} data-on={c.id === colorId || undefined} title={c.name}>
                  <input type="radio" name="color" className="sr-only" checked={c.id === colorId} onChange={() => setColorId(c.id)} />
                  <span style={{ background: c.hex }} />
                  <span className="sr-only">{c.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.field}>
            <legend className="mono">
              Size <span>{size ?? "—"}</span>
            </legend>
            <div className={styles.sizes}>
              {t.sizes.map((s) => (
                <label key={s} className={styles.size} data-on={size === s || undefined}>
                  <input type="radio" name="size" className="sr-only" checked={size === s} onChange={() => setSize(s)} />
                  <span className="mono">{s}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className={styles.field}>
            <span className="mono">{tx("cz.note")}</span>
            <textarea rows={2} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. keep the colours exactly as the file" />
          </label>

          <div className={styles.priceRow}>
            <div>
              <p className={`${styles.price} display`}>{formatPrice(price * qty)}</p>
              <p className="mono">
                Base {formatPrice(t.basePrice)}
                {views.map((v) => (usedSides.includes(v.side) && v.printPrice ? ` + ${SIDE_LABEL[v.side].toLowerCase()} print ${formatPrice(v.printPrice)}` : ""))}
              </p>
            </div>
            <QtyStepper value={qty} onChange={setQty} />
          </div>

          {msg && (
            <p className={styles.error} role="alert">
              {msg}
            </p>
          )}

          {added ? (
            <div className={styles.added} role="status">
              <p className="mono">{tx("cz.added")}</p>
              <div className={styles.tools}>
                <TransitionLink href="/checkout" className="btn btn--ink">
                  {tx("pdp.checkout")}
                </TransitionLink>
                <button type="button" className="btn btn--ghost" onClick={startOver}>
                  {tx("cz.another")}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn--ink btn--block" onClick={startReview} disabled={busy !== null}>
              {busy === "preview" ? tx("cz.rendering") : tx("cz.preview")}
            </button>
          )}
          <p className={`${styles.fine} mono`}>Printed at {PRINT_DPI} dpi. You confirm the preview before anything is added.</p>
        </aside>
      </div>

      {review && (
        <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Confirm your design" data-lenis-prevent>
          <div className={styles.modalCard}>
            <p className="mono">{tx("cz.step2")}</p>
            <h2 className="display">{tx("cz.check")}</h2>
            <div className={styles.reviewGrid}>
              {review.map((r) => (
                <figure key={r.side}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={r.preview} alt={`${SIDE_LABEL[r.side]} mockup`} />
                  <figcaption className="mono">
                    {SIDE_LABEL[r.side]} · art {r.exp.artWidthCm} × {r.exp.artHeightCm} cm
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mono">
              {t.name} · {color?.name} · Size {size} × {qty} · {formatPrice(price * qty)}
            </p>
            <div className={styles.tools}>
              <button type="button" className="btn btn--ink" onClick={confirm} disabled={busy === "adding"}>
                {busy === "adding" ? tx("cz.uploading") : tx("cz.confirm")}
              </button>
              <button type="button" className="btn btn--ghost" onClick={closeReview} disabled={busy === "adding"}>
                {tx("cz.keepEditing")}
              </button>
            </div>
            {msg && (
              <p className={styles.error} role="alert">
                {msg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LayerView({ layer: l, onPointerDown }: { layer: Layer; onPointerDown: (e: React.PointerEvent) => void }) {
  const style: React.CSSProperties = {
    left: `${l.x * 100}%`,
    top: `${l.y * 100}%`,
    transform: `translate(-50%, -50%) rotate(${l.rot}deg)`,
  };
  if (l.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local object URL
      <img src={l.url} alt="" draggable={false} className={styles.layer} style={{ ...style, width: `${l.w * 100}%` }} onPointerDown={onPointerDown} />
    );
  }
  return (
    <div className={styles.layer} style={style} onPointerDown={onPointerDown}>
      <TextBody layer={l} />
    </div>
  );
}

function TextBody({ layer: l, ghost }: { layer: TextLayer; ghost?: boolean }) {
  const f = FONTS[l.font];
  return (
    <span
      className={styles.text}
      style={{ fontFamily: f.css, fontWeight: f.weight, fontSize: `${l.size * 100}cqw`, color: l.color, visibility: ghost ? "hidden" : undefined }}
    >
      {l.text || " "}
    </span>
  );
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
function luminance(hex: string) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
