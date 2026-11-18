"use client";

import { useActionState, useState } from "react";
import { disconnectIntegration, saveIntegration } from "@/server/admin";
import type { IntegrationProvider } from "@/data/integrations";
import styles from "./Admin.module.css";

/** Saved values for the form. Secret fields only say whether one is saved. */
export type IntegrationView = { enabled: boolean; values: Record<string, string>; secretsSet: Record<string, boolean>; updatedAt: string } | null;

export function IntegrationCard({ provider: p, saved }: { provider: IntegrationProvider; saved: IntegrationView }) {
  const [state, action, pending] = useActionState(saveIntegration.bind(null, p.id), {});
  const [open, setOpen] = useState(false);
  const status = saved?.enabled ? { label: "Connected", s: "delivered" } : saved ? { label: "Saved, off", s: "in_production" } : { label: "Not connected", s: "off" };

  return (
    <section className={`${styles.card} ${styles.intCard}`}>
      <div className={styles.methodHead}>
        <div className={styles.intName}>
          <span className={styles.intLogo} aria-hidden="true">
            {p.name.slice(0, 1)}
          </span>
          <div>
            <strong>{p.name}</strong>
            <p className={styles.muted}>{p.blurb}</p>
          </div>
        </div>
        <span className={styles.pill} data-s={status.s}>
          {status.label}
        </span>
      </div>

      {!open ? (
        <div className={styles.actions} style={{ marginTop: 14 }}>
          <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => setOpen(true)}>
            {saved ? "Manage" : "Connect"}
          </button>
        </div>
      ) : (
        <form action={action} className={styles.stack} style={{ marginTop: 16 }}>
          {p.fields.map((f) => (
            <label key={f.key} className={styles.field}>
              <span>{f.label}</span>
              <input
                name={f.key}
                type={f.secret ? "password" : "text"}
                autoComplete="off"
                defaultValue={f.secret ? "" : saved?.values[f.key] ?? ""}
                placeholder={f.secret && saved?.secretsSet[f.key] ? "•••••••• saved · type to replace" : f.placeholder}
              />
            </label>
          ))}
          <label className={styles.check}>
            <input type="checkbox" name="enabled" defaultChecked={saved?.enabled ?? true} />
            Use {p.name} for this store
          </label>
          <p className={styles.muted} style={{ fontSize: "0.82rem" }}>
            Keys stay on the server and are never shown to customers. Get them from{" "}
            <a href={p.docs} target="_blank" rel="noopener noreferrer" className={styles.rowLink}>
              your {p.name} dashboard ↗
            </a>
            .
          </p>
          {state?.error && !pending && <p className={styles.error}>{state.error}</p>}
          {state?.saved && !pending && <p className={styles.success}>Saved</p>}
          <div className={styles.actions}>
            <button type="submit" className={styles.btn} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setOpen(false)}>
              Close
            </button>
            {saved && (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={async () => {
                  if (!window.confirm(`Disconnect ${p.name} and delete its saved keys?`)) return;
                  await disconnectIntegration(p.id);
                  setOpen(false);
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
