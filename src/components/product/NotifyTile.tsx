"use client";

import { useState, type FormEvent } from "react";
import { useText } from "@/lib/catalog";
import { Rich } from "@/components/brand/Rich";
import styles from "./NotifyTile.module.css";

/** "Next drop" teaser. NOTE: not connected to an email provider yet. */
export function NotifyTile() {
  const [done, setDone] = useState(false);
  const t = useText();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setDone(true);
  };
  return (
    <aside className={styles.tile} aria-labelledby="notify-title">
      <div className={styles.lock} aria-hidden="true">
        <span className="display">02</span>
      </div>
      <p className="mono">{t("notify.kicker")}</p>
      <h3 id="notify-title" className="display">
        <Rich text={t("notify.title")} />
      </h3>
      {done ? (
        <p className="mono" role="status" style={{ color: "var(--blue-hi)" }}>
          {t("notify.done")}
        </p>
      ) : (
        <form onSubmit={submit} className={styles.form}>
          <label htmlFor="notify-email" className="sr-only">
            Email for Drop 02
          </label>
          <input id="notify-email" type="email" required placeholder={t("notify.placeholder")} autoComplete="email" />
          <button type="submit" className="btn">
            {t("notify.button")}
          </button>
        </form>
      )}
    </aside>
  );
}
