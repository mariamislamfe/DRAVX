"use client";

import { useActionState } from "react";
import { saveSettings } from "@/server/admin";
import { MAX_PIXELS, type BrandInfo, type Settings } from "@/data/schema";
import styles from "./Admin.module.css";

type Field = { key: keyof BrandInfo; label: string; placeholder?: string; hint?: string; long?: boolean; type?: string };

const IDENTITY: Field[] = [
  { key: "name", label: "Brand name", hint: "Shown in the browser tab, search results and the footer." },
  { key: "tagline", label: "Tagline", placeholder: "Turn your back on them." },
  { key: "description", label: "Short description", hint: "Used by Google and when the site is shared.", long: true },
  { key: "siteUrl", label: "Website address", placeholder: "https://dravx.com", type: "url" },
  { key: "currency", label: "Currency", placeholder: "EGP", hint: "3-letter code: EGP, USD, SAR, AED…" },
];

const CONTACT: Field[] = [
  { key: "email", label: "Email", placeholder: "hello@dravx.com", type: "email" },
  { key: "phone", label: "Phone", placeholder: "+20 100 000 0000", type: "tel" },
  { key: "whatsapp", label: "WhatsApp number", placeholder: "+20 100 000 0000", type: "tel" },
  { key: "instagram", label: "Instagram", placeholder: "@dravx or full link" },
  { key: "tiktok", label: "TikTok", placeholder: "@dravx or full link" },
  { key: "facebook", label: "Facebook", placeholder: "page name or full link" },
];

export function SettingsForm({ settings: s }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettings, {});

  const field = (f: Field) => (
    <label key={f.key} className={styles.field}>
      <span>{f.label}</span>
      {f.long ? (
        <textarea name={`brand.${f.key}`} rows={3} defaultValue={s.brand[f.key]} placeholder={f.placeholder} />
      ) : (
        <input name={`brand.${f.key}`} type={f.type ?? "text"} defaultValue={s.brand[f.key]} placeholder={f.placeholder} />
      )}
      {f.hint && <small>{f.hint}</small>}
    </label>
  );

  return (
    <form action={action} className={`${styles.stack} ${styles.narrow}`}>
      <section className={styles.card}>
        <h2>Brand</h2>
        <div className={styles.stack}>{IDENTITY.map(field)}</div>
      </section>

      <section className={styles.card}>
        <h2>Contact & social</h2>
        <p className={styles.muted} style={{ marginBottom: 12 }}>
          Shown in the footer and menu. Leave a field empty to hide it.
        </p>
        <div className={styles.grid2}>{CONTACT.map(field)}</div>
      </section>

      <section className={styles.card}>
        <h2>Store features</h2>
        <label className={styles.check}>
          <input type="checkbox" name="customizerEnabled" defaultChecked={s.customizerEnabled} />
          Customizer open to customers (/customize)
        </label>
        <p className={styles.muted} style={{ marginTop: 10, fontSize: "0.85rem" }}>
          Shipping fees and policies are under Shipping; payment methods under Payments.
        </p>
      </section>

      <section className={styles.card}>
        <h2>Meta Pixel</h2>
        <p className={styles.muted} style={{ marginBottom: 12 }}>
          Pixel IDs from Meta Events Manager (digits only). The store sends PageView, AddToCart, InitiateCheckout and Purchase. Leave all
          empty for no tracking.
        </p>
        <div className={styles.grid2}>
          {Array.from({ length: MAX_PIXELS }, (_, i) => (
            <label key={i} className={styles.field}>
              <span>Pixel ID {i + 1}</span>
              <input name="metaPixel" inputMode="numeric" pattern="\d{6,20}" defaultValue={s.metaPixels?.[i] ?? ""} placeholder="123456789012345" />
            </label>
          ))}
        </div>
      </section>

      <div className={styles.saveBar}>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </button>
          {state?.saved && !pending && <span className={styles.success}>Saved</span>}
          {state?.error && !pending && <span className={styles.error}>{state.error}</span>}
        </div>
      </div>
    </form>
  );
}
