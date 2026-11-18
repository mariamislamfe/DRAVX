"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveDiscount } from "@/server/admin";
import type { Discount } from "@/data/schema";
import styles from "./Admin.module.css";

export function DiscountForm({ initial }: { initial?: Discount }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(saveDiscount, {});
  const [type, setType] = useState<Discount["type"]>(initial?.type ?? "percent");

  useEffect(() => {
    if (!state?.saved) return;
    if (initial) router.push("/admin/discounts");
    else {
      form.current?.reset();
      setType("percent");
    }
  }, [state, initial, router]);

  return (
    <form ref={form} action={action} className={styles.stack}>
      <h2 className={styles.cardTitle}>{initial ? `Edit ${initial.code}` : "New code"}</h2>
      {initial && <input type="hidden" name="originalCode" value={initial.code} />}
      <label className={styles.field}>
        <span>Code</span>
        <input
          name="code"
          required
          defaultValue={initial?.code}
          placeholder="WELCOME10"
          autoCapitalize="characters"
          autoComplete="off"
          style={{ textTransform: "uppercase" }}
        />
      </label>
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span>Type</span>
          <select name="type" value={type} onChange={(e) => setType(e.target.value as Discount["type"])}>
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount off</option>
            <option value="free_shipping">Free shipping</option>
          </select>
        </label>
        {type !== "free_shipping" && (
          <label className={styles.field}>
            <span>{type === "percent" ? "Percent" : "Amount"}</span>
            <input name="value" type="number" min={0} max={type === "percent" ? 100 : undefined} step="0.01" required defaultValue={initial?.value || ""} />
          </label>
        )}
      </div>
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span>Minimum order</span>
          <input name="minSubtotal" type="number" min={0} step="0.01" defaultValue={initial?.minSubtotal ?? 0} />
        </label>
        <label className={styles.field}>
          <span>Usage limit</span>
          <input name="maxUses" type="number" min={0} step="1" defaultValue={initial?.maxUses ?? 0} />
          <small>0 = unlimited</small>
        </label>
      </div>
      <label className={styles.field}>
        <span>Expires on (optional)</span>
        <input name="expiresAt" type="date" defaultValue={initial?.expiresAt} />
      </label>
      <label className={styles.check}>
        <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} />
        Active
      </label>
      {state?.error && !pending && <p className={styles.error}>{state.error}</p>}
      {state?.saved && !pending && !initial && <p className={styles.success}>Code saved</p>}
      <div className={styles.actions}>
        <button type="submit" className={styles.btn} disabled={pending}>
          {pending ? "Saving…" : initial ? "Save changes" : "Create code"}
        </button>
        {initial && (
          <Link href="/admin/discounts" className={styles.btnGhost}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
