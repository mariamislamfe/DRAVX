"use client";

import { useState, type FormEvent } from "react";
import styles from "./NotifyTile.module.css";

/** "Next drop" teaser. NOTE: not connected to an email provider yet. */
export function NotifyTile() {
  const [done, setDone] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setDone(true);
  };
  return (
    <aside className={styles.tile} aria-labelledby="notify-title">
      <div className={styles.lock} aria-hidden="true">
        <span className="display">02</span>
      </div>
      <p className="mono">Drop 02 — locked</p>
      <h3 id="notify-title" className="display">
        Something else is <em className="serif">turning</em> around.
      </h3>
      {done ? (
        <p className="mono" role="status" style={{ color: "var(--blue-hi)" }}>
          ✳ Noted. (Demo: no email provider connected.)
        </p>
      ) : (
        <form onSubmit={submit} className={styles.form}>
          <label htmlFor="notify-email" className="sr-only">
            Email for Drop 02
          </label>
          <input id="notify-email" type="email" required placeholder="Email for first access" autoComplete="email" />
          <button type="submit" className="btn">
            Notify me
          </button>
        </form>
      )}
    </aside>
  );
}
