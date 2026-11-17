"use client";

import { useActionState } from "react";
import { saveSettings } from "@/server/admin";
import type { Settings } from "@/data/schema";
import styles from "./Admin.module.css";

export function SettingsForm({ settings: s }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettings, {});
  return (
    <form action={action} className={styles.card} style={{ maxWidth: 560 }}>
      <div className={styles.stack}>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Shipping fee</span>
            <input type="number" name="shippingFee" min={0} step="0.01" defaultValue={s.shippingFee} />
          </label>
          <label className={styles.field}>
            <span>Free shipping from</span>
            <input type="number" name="freeShippingThreshold" min={0} step="0.01" defaultValue={s.freeShippingThreshold} />
            <small>Order subtotal at which shipping becomes free</small>
          </label>
        </div>
        <label className={styles.check}>
          <input type="checkbox" name="customizerEnabled" defaultChecked={s.customizerEnabled} />
          Customizer open to customers (/customize)
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </button>
          {state?.saved && !pending && <span className={styles.success}>Saved</span>}
        </div>
        <p className={styles.muted}>
          The dashboard password comes from the <code>ADMIN_PASSWORD</code> environment variable on the server.
        </p>
      </div>
    </form>
  );
}
