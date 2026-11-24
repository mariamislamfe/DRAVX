"use client";

import { formatPrice } from "@/config/brand";
import { useCatalog, useText } from "@/lib/catalog";
import styles from "./Cart.module.css";

export function ShippingMeter({ subtotal }: { subtotal: number }) {
  const threshold = useCatalog().settings.freeShippingThreshold;
  const t = useText();
  if (threshold <= 0) return null; // free shipping is switched off
  const remaining = Math.max(0, threshold - subtotal);
  const pct = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;
  return (
    <div className={styles.meter}>
      <p className="mono">
        {remaining > 0 ? (
          <>{t("meter.away", { price: formatPrice(remaining) })}</>
        ) : (
          <>{t("meter.unlocked")}</>
        )}
      </p>
      <div
        className={styles.meterTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Progress to free shipping"
      >
        <div className={styles.meterFill} style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}
