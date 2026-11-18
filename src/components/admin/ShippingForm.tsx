"use client";

import { useActionState, useState } from "react";
import { saveShipping } from "@/server/admin";
import type { Settings, ShippingZone } from "@/data/schema";
import styles from "./Admin.module.css";

type Zone = { name: string; fee: string; days: string };

const EGYPT = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Qalyubia",
  "Sharqia",
  "Dakahlia",
  "Gharbia",
  "Monufia",
  "Beheira",
  "Kafr El Sheikh",
  "Damietta",
  "Port Said",
  "Ismailia",
  "Suez",
  "Faiyum",
  "Beni Suef",
  "Minya",
  "Asyut",
  "Sohag",
  "Qena",
  "Luxor",
  "Aswan",
  "Red Sea",
  "Matrouh",
  "North Sinai",
  "South Sinai",
  "New Valley",
];

const toRow = (z: ShippingZone): Zone => ({ name: z.name, fee: String(z.fee), days: z.days ?? "" });

export function ShippingForm({ settings: s }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveShipping, {});
  const [zones, setZones] = useState<Zone[]>(() => (s.shippingZones ?? []).map(toRow));

  const update = (i: number, p: Partial<Zone>) => setZones((z) => z.map((row, j) => (j === i ? { ...row, ...p } : row)));
  const addEgypt = () =>
    setZones((z) => [...z, ...EGYPT.filter((n) => !z.some((r) => r.name.toLowerCase() === n.toLowerCase())).map((n) => ({ name: n, fee: String(s.shippingFee), days: "" }))]);

  return (
    <form action={action} className={styles.stack}>
      <input type="hidden" name="zones" value={JSON.stringify(zones.map((z) => ({ name: z.name, fee: Number(z.fee) || 0, days: z.days })))} />

      <section className={styles.card}>
        <h2>Rates</h2>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Standard shipping fee</span>
            <input type="number" name="shippingFee" min={0} step="0.01" defaultValue={s.shippingFee} />
            <small>Used when there are no zones below</small>
          </label>
          <label className={styles.field}>
            <span>Free shipping from</span>
            <input type="number" name="freeShippingThreshold" min={0} step="0.01" defaultValue={s.freeShippingThreshold} />
            <small>Order subtotal for free delivery · 0 = never free</small>
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.methodHead}>
          <div>
            <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
              Delivery zones
            </h2>
            <p className={styles.muted}>Optional. With zones, the customer picks their area at checkout and pays that zone&apos;s fee.</p>
          </div>
        </div>
        {zones.length > 0 && (
          <div className={styles.zoneList}>
            <div className={`${styles.zoneRow} ${styles.zoneHead}`} aria-hidden="true">
              <span>Area</span>
              <span>Fee</span>
              <span>Delivery time</span>
              <span />
            </div>
            {zones.map((z, i) => (
              <div key={i} className={styles.zoneRow}>
                <input value={z.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Cairo" aria-label="Area name" />
                <input type="number" min={0} step="0.01" value={z.fee} onChange={(e) => update(i, { fee: e.target.value })} aria-label="Fee" />
                <input value={z.days} onChange={(e) => update(i, { days: e.target.value })} placeholder="2–3 days" aria-label="Delivery time" />
                <button type="button" className={styles.chartX} onClick={() => setZones((all) => all.filter((_, j) => j !== i))} aria-label={`Remove ${z.name || "zone"}`}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className={styles.actions} style={{ marginTop: 12 }}>
          <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => setZones((z) => [...z, { name: "", fee: String(s.shippingFee), days: "" }])}>
            + Add zone
          </button>
          <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={addEgypt}>
            + All Egypt governorates
          </button>
          {zones.length > 0 && (
            <button type="button" className={`${styles.btnDanger} ${styles.btnSm}`} onClick={() => window.confirm("Remove all zones?") && setZones([])}>
              Clear
            </button>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h2>Policies</h2>
        <div className={styles.stack}>
          <label className={styles.field}>
            <span>Shipping</span>
            <textarea name="shippingInfo" rows={3} defaultValue={s.brand.shippingInfo} />
            <small>Shown on every product page under “Shipping & returns”.</small>
          </label>
          <label className={styles.field}>
            <span>Returns & exchanges</span>
            <textarea name="returnsInfo" rows={3} defaultValue={s.brand.returnsInfo} placeholder="e.g. Exchanges within 14 days, unworn with tags." />
          </label>
        </div>
      </section>

      <div className={styles.saveBar}>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? "Saving…" : "Save shipping"}
          </button>
          {state?.saved && !pending && <span className={styles.success}>Saved</span>}
          {state?.error && !pending && <span className={styles.error}>{state.error}</span>}
        </div>
      </div>
    </form>
  );
}
