"use client";

import { useState, useTransition } from "react";
import { saveHome } from "@/server/admin";
import { DEFAULT_HOME, SECTION_LABEL, newVideo, type HomeSection, type HomeSettings, type HomeVideo } from "@/data/schema";
import type { Product } from "@/data/products";
import { MediaField } from "./MediaField";
import styles from "./Admin.module.css";
import h from "./HomeEditor.module.css";

type Opt = Pick<Product, "slug" | "name" | "active">;

export function HomeEditor({ home: initial, products }: { home: HomeSettings; products: Opt[] }) {
  const [home, setHome] = useState<HomeSettings>(() => ({
    ...structuredClone(initial),
    turn: [0, 1].map((i) => initial.turn?.[i] ?? DEFAULT_HOME.turn[i]),
  }));
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (p: Partial<HomeSettings>) => {
    setHome((x) => ({ ...x, ...p }));
    setMsg(null);
  };
  const setSection = (id: string, p: Partial<HomeSection>) => set({ sections: home.sections.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const setVideo = (id: string, p: Partial<HomeVideo>) =>
    set({ sections: home.sections.map((s) => (s.id === id ? { ...s, video: { ...(s.video ?? newVideo()), ...p } } : s)) });
  const move = (i: number, d: -1 | 1) => {
    const list = [...home.sections];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set({ sections: list });
  };
  const addVideo = () => {
    const id = `video-${Date.now().toString(36)}`;
    set({ sections: [...home.sections, { id, type: "video", enabled: true, video: newVideo() }] });
    setOpen(id);
  };
  const removeSection = (id: string) => {
    if (!confirm("Delete this video section?")) return;
    set({ sections: home.sections.filter((s) => s.id !== id) });
  };
  const setTurn = (i: number, p: Partial<HomeSettings["turn"][number]>) => set({ turn: home.turn.map((t, j) => (j === i ? { ...t, ...p } : t)) });

  const save = () =>
    start(async () => {
      const res = await saveHome(home);
      setMsg(res.ok ? { ok: true, text: "Saved. The homepage is updated." } : { ok: false, text: res.error });
    });

  const productSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={products.some((p) => p.slug === value) ? value : ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Automatic (first available)</option>
        {products.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
            {p.active ? "" : " (hidden)"}
          </option>
        ))}
      </select>
    </label>
  );

  const lines = (v: string[]) => v.join("\n");
  const toLines = (v: string) => v.split("\n").map((s) => s.trimStart()).slice(0, 6);

  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <h2>Hero</h2>
        <p className={styles.muted} style={{ marginBottom: 12 }}>
          The two products sharing the split screen at the top of the homepage. If one is hidden or deleted later, the site picks
          another one by itself. Headline text is under Site text → Home: hero.
        </p>
        <div className={styles.grid2}>
          {productSelect(home.heroLeft, (v) => set({ heroLeft: v }), "Left half")}
          {productSelect(home.heroRight, (v) => set({ heroRight: v }), "Right half")}
        </div>
      </section>

      <section className={styles.card}>
        <h2>Sections</h2>
        <p className={styles.muted} style={{ marginBottom: 12 }}>
          Turn sections on or off and change their order with the arrows. Add as many full-width video sections as you like.
        </p>
        <ol className={h.list}>
          {home.sections.map((s, i) => {
            const editable = s.type === "video" || s.type === "turn";
            const isOpen = open === s.id;
            const name = s.type === "video" ? `Video: ${s.video?.title.replace(/\*/g, "") || "untitled"}` : SECTION_LABEL[s.type];
            return (
              <li key={s.id} className={h.row} data-off={!s.enabled || undefined}>
                <div className={h.rowHead}>
                  <span className={h.num}>{i + 1}</span>
                  <span className={h.name}>
                    {name}
                    {s.type === "video" && !s.video?.src && <small className={styles.muted}> · no video yet</small>}
                  </span>
                  <div className={h.tools}>
                    <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${name} up`}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnGhost} ${styles.btnSm}`}
                      onClick={() => move(i, 1)}
                      disabled={i === home.sections.length - 1}
                      aria-label={`Move ${name} down`}
                    >
                      ↓
                    </button>
                    {editable && (
                      <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                        {isOpen ? "Close" : "Edit"}
                      </button>
                    )}
                    <label className={styles.switch}>
                      <input type="checkbox" checked={s.enabled} onChange={(e) => setSection(s.id, { enabled: e.target.checked })} />
                      <span aria-hidden="true" />
                      <span className="sr-only">Show {name}</span>
                    </label>
                  </div>
                </div>

                {isOpen && s.type === "turn" && (
                  <div className={h.body}>
                    <p className={styles.muted} style={{ fontSize: "0.85rem" }}>
                      Two hoodies that turn from front to back as you scroll, with short notes on each side (one per line, up to 6).
                    </p>
                    <div className={styles.grid2}>
                      {[0, 1].map((n) => (
                        <div key={n} className={styles.stack}>
                          {productSelect(home.turn[n].slug, (v) => setTurn(n, { slug: v }), `Hoodie ${n + 1}`)}
                          <label className={styles.field}>
                            <span>Front notes</span>
                            <textarea rows={3} value={lines(home.turn[n].front)} onChange={(e) => setTurn(n, { front: toLines(e.target.value) })} />
                          </label>
                          <label className={styles.field}>
                            <span>Back notes</span>
                            <textarea rows={3} value={lines(home.turn[n].back)} onChange={(e) => setTurn(n, { back: toLines(e.target.value) })} />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isOpen && s.type === "video" && s.video && <VideoForm v={s.video} products={products} onChange={(p) => setVideo(s.id, p)} onDelete={() => removeSection(s.id)} />}
              </li>
            );
          })}
        </ol>
        <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={addVideo} style={{ marginTop: 12 }}>
          + Add video section
        </button>
      </section>

      <div className={styles.saveBar}>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save homepage"}
          </button>
          {msg && !pending && <span className={msg.ok ? styles.success : styles.error}>{msg.text}</span>}
        </div>
      </div>
    </div>
  );
}

function VideoForm({ v, products, onChange, onDelete }: { v: HomeVideo; products: Opt[]; onChange: (p: Partial<HomeVideo>) => void; onDelete: () => void }) {
  const toggleProduct = (slug: string, on: boolean) =>
    onChange({ products: on ? [...v.products.filter((s) => s !== slug), slug].slice(0, 8) : v.products.filter((s) => s !== slug) });

  return (
    <div className={h.body}>
      <div className={styles.grid2}>
        <MediaField
          label="Video"
          kind="video"
          value={v.src}
          onChange={(src) => onChange({ src })}
          hint="MP4 (H.264) or WebM, muted, 10–30 s loop. Keep it small (under ~10 MB); for bigger files paste a link."
        />
        <MediaField label="Phone video (optional)" kind="video" value={v.mobileSrc} onChange={(mobileSrc) => onChange({ mobileSrc })} hint="Vertical or lighter cut for phones." />
        <MediaField label="Cover image (optional)" kind="image" value={v.poster} onChange={(poster) => onChange({ poster })} hint="Shown while the video loads." />
        <MediaField label="Logo image (optional)" kind="image" value={v.logo} onChange={(logo) => onChange({ logo })} hint="Empty = the brand logo. Use a transparent PNG." />
      </div>

      <label className={styles.check}>
        <input type="checkbox" checked={v.showLogo} onChange={(e) => onChange({ showLogo: e.target.checked })} />
        Show the logo
      </label>

      <div className={styles.grid2}>
        <label className={styles.field}>
          <span>Small label</span>
          <input value={v.eyebrow} onChange={(e) => onChange({ eyebrow: e.target.value })} maxLength={120} />
        </label>
        <label className={styles.field}>
          <span>Title</span>
          <input value={v.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={160} />
          <small>*stars* = italic accent</small>
        </label>
      </div>
      <label className={styles.field}>
        <span>Text</span>
        <textarea rows={2} value={v.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={600} />
      </label>
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span>Button text</span>
          <input value={v.ctaLabel} onChange={(e) => onChange({ ctaLabel: e.target.value })} maxLength={60} placeholder="Empty = no button" />
        </label>
        <label className={styles.field}>
          <span>Button link</span>
          <input value={v.ctaHref} onChange={(e) => onChange({ ctaHref: e.target.value })} placeholder="/shop or https://…" />
        </label>
      </div>

      <div className={styles.grid3}>
        <label className={styles.field}>
          <span>Darken video: {v.overlay}%</span>
          <input type="range" min={0} max={80} step={5} value={v.overlay} onChange={(e) => onChange({ overlay: +e.target.value })} />
        </label>
        <label className={styles.field}>
          <span>Text position</span>
          <select value={v.align} onChange={(e) => onChange({ align: e.target.value as HomeVideo["align"] })}>
            <option value="center">Centre</option>
            <option value="left">Left</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Height</span>
          <select value={v.height} onChange={(e) => onChange({ height: e.target.value as HomeVideo["height"] })}>
            <option value="full">Full screen</option>
            <option value="tall">Shorter (¾ screen)</option>
          </select>
        </label>
      </div>

      <div className={styles.field}>
        <span>Products on the video ({v.products.length}/8)</span>
        <div className={styles.chips}>
          {products.map((p) => (
            <label key={p.slug} className={styles.chip}>
              <input type="checkbox" checked={v.products.includes(p.slug)} onChange={(e) => toggleProduct(p.slug, e.target.checked)} />
              {p.name}
              {p.active ? "" : " (hidden)"}
            </label>
          ))}
        </div>
      </div>

      <div>
        <button type="button" className={`${styles.btnDanger} ${styles.btnSm}`} onClick={onDelete}>
          Delete this video section
        </button>
      </div>
    </div>
  );
}
