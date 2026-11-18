"use client";

import { useActionState, useState } from "react";
import { savePayments } from "@/server/admin";
import { PAYMENT_LABEL, PAYMENT_METHODS, type PaymentMethod, type PaymentSettings } from "@/data/schema";
import styles from "./Admin.module.css";

const HELP: Record<PaymentMethod, { blurb: string; placeholder?: string }> = {
  cod: { blurb: "Customer pays the courier in cash when the order arrives." },
  instapay: {
    blurb: "Customer transfers the total before shipping. Shown at checkout and on the confirmation.",
    placeholder: "InstaPay: dravx@instapay\nor Bank: CIB · Account 1000 2000 3000 · DRAVX LLC",
  },
  wallet: {
    blurb: "Vodafone Cash, Orange Cash, Etisalat Cash… Customer sends the total to your number.",
    placeholder: "Vodafone Cash: 0100 000 0000 (DRAVX)",
  },
};

export function PaymentsForm({ payments }: { payments: PaymentSettings }) {
  const [state, action, pending] = useActionState(savePayments, {});
  const [on, setOn] = useState(() => Object.fromEntries(PAYMENT_METHODS.map((m) => [m, payments[m].enabled])) as Record<PaymentMethod, boolean>);

  return (
    <form action={action} className={styles.stack}>
      {PAYMENT_METHODS.map((m) => (
        <section key={m} className={styles.card} data-off={!on[m] || undefined}>
          <div className={styles.methodHead}>
            <div>
              <strong>{PAYMENT_LABEL[m]}</strong>
              <p className={styles.muted}>{HELP[m].blurb}</p>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" name={`${m}.enabled`} checked={on[m]} onChange={(e) => setOn({ ...on, [m]: e.target.checked })} />
              <span aria-hidden="true" />
              <span className="sr-only">Enable {PAYMENT_LABEL[m]}</span>
            </label>
          </div>
          {m !== "cod" ? (
            <label className={styles.field} style={{ marginTop: 14, display: on[m] ? undefined : "none" }}>
              <span>Payment details shown to the customer</span>
              <textarea name={`${m}.details`} rows={3} defaultValue={payments[m].details} placeholder={HELP[m].placeholder} />
            </label>
          ) : (
            <input type="hidden" name={`${m}.details`} value="" />
          )}
        </section>
      ))}

      <div className={styles.saveBar}>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? "Saving…" : "Save payments"}
          </button>
          {state?.saved && !pending && <span className={styles.success}>Saved</span>}
          {state?.error && !pending && <span className={styles.error}>{state.error}</span>}
        </div>
      </div>
    </form>
  );
}
