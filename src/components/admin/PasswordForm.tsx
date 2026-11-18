"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/server/admin";
import styles from "./Admin.module.css";

export function PasswordForm({ isDefault, changedAt }: { isDefault: boolean; changedAt?: string }) {
  const [state, action, pending] = useActionState(changePassword, {});
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.saved) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className={styles.card} id="password">
      <h2>Password</h2>
      {isDefault && !state?.saved && (
        <p className={styles.warnBox}>You&apos;re still using the default password (123456). Change it before the store goes live.</p>
      )}
      <div className={styles.stack}>
        <label className={styles.field}>
          <span>Current password</span>
          <input type="password" name="current" required autoComplete="current-password" />
        </label>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>New password</span>
            <input type="password" name="next" required minLength={8} autoComplete="new-password" />
            <small>At least 8 characters</small>
          </label>
          <label className={styles.field}>
            <span>Repeat new password</span>
            <input type="password" name="confirm" required minLength={8} autoComplete="new-password" />
          </label>
        </div>
        <p className={styles.muted} style={{ fontSize: "0.85rem" }}>
          Changing it signs out every other phone and computer. {changedAt && `Last changed ${changedAt}.`}
        </p>
        {state?.error && !pending && <p className={styles.error}>{state.error}</p>}
        {state?.saved && !pending && <p className={styles.success}>Password changed</p>}
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? "Saving…" : "Change password"}
          </button>
        </div>
      </div>
    </form>
  );
}
