"use client";

import { useActionState } from "react";
import { login } from "@/server/admin";
import styles from "./Admin.module.css";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className={styles.stack}>
      <label className={styles.field}>
        <span>Password</span>
        <input type="password" name="password" required autoFocus autoComplete="current-password" />
      </label>
      {state?.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className={styles.btn} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
