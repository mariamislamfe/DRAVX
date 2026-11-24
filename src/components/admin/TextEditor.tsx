"use client";

import { useActionState, useRef, useState } from "react";
import { saveText } from "@/server/admin";
import { DEFAULT_TEXT, TEXT_GROUPS } from "@/data/content";
import styles from "./Admin.module.css";

/**
 * Every storefront text, grouped by page. Shows what's live now; anything
 * left as the default (or emptied) follows the built-in text.
 */
export function TextEditor({ text }: { text: Record<string, string> }) {
  const [state, action, pending] = useActionState(saveText, {});
  const [q, setQ] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const needle = q.trim().toLowerCase();
  const match = (label: string, key: string) =>
    !needle || label.toLowerCase().includes(needle) || (text[key] ?? DEFAULT_TEXT[key]).toLowerCase().includes(needle);

  const reset = (key: string) => {
    const el = form.current?.elements.namedItem(`t.${key}`) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) el.value = DEFAULT_TEXT[key];
  };

  const changed = Object.keys(text).filter((k) => k in DEFAULT_TEXT).length;

  return (
    <form ref={form} action={action} className={styles.stack}>
      <section className={styles.card}>
        <div className={styles.stack}>
          <label className={styles.field}>
            <span>Find a text</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. checkout, Add to bag, footer…" />
          </label>
          <p className={styles.muted} style={{ fontSize: "0.85rem" }}>
            Words in {"{curly brackets}"} are filled in by the site (price, size, name…), so keep them. Put *stars* around words to show
            them in the italic accent font. {changed > 0 ? `${changed} text${changed === 1 ? "" : "s"} changed from the default.` : ""}
          </p>
        </div>
      </section>

      {TEXT_GROUPS.map((g) => {
        const visible = g.fields.filter((f) => match(f.label, f.key));
        return (
          <details key={g.id} className={styles.card} open={!!needle && visible.length > 0} hidden={!!needle && !visible.length}>
            <summary style={{ cursor: "pointer", fontWeight: 600, minHeight: 32, display: "flex", alignItems: "center", gap: 8 }}>
              {g.title}
              <small className={styles.muted} style={{ fontWeight: 400 }}>
                {g.fields.length} texts
                {g.fields.some((f) => text[f.key]) ? ` · ${g.fields.filter((f) => text[f.key]).length} changed` : ""}
              </small>
            </summary>
            {g.note && (
              <p className={styles.muted} style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                {g.note}
              </p>
            )}
            <div className={styles.stack} style={{ marginTop: 14 }}>
              {g.fields.map((f) => {
                const value = text[f.key] ?? f.def;
                return (
                  <label key={f.key} className={styles.field} hidden={!match(f.label, f.key)}>
                    <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      {f.label}
                      <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => reset(f.key)} title={`Default: ${f.def}`}>
                        Default
                      </button>
                    </span>
                    {f.long || f.def.length > 70 ? (
                      <textarea name={`t.${f.key}`} rows={3} defaultValue={value} placeholder={f.def} maxLength={800} />
                    ) : (
                      <input name={`t.${f.key}`} defaultValue={value} placeholder={f.def} maxLength={800} />
                    )}
                  </label>
                );
              })}
            </div>
          </details>
        );
      })}

      <div className={styles.saveBar}>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? "Saving…" : "Save texts"}
          </button>
          {state?.saved && !pending && <span className={styles.success}>Saved. The site shows the new texts now.</span>}
          {state?.error && !pending && <span className={styles.error}>{state.error}</span>}
        </div>
      </div>
    </form>
  );
}
