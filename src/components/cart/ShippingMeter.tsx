"use client";

import { formatPrice } from "@/config/brand";
import { useCatalog } from "@/lib/catalog";
import styles from "./Cart.module.css";

export function ShippingMeter({ subtotal }: { subtotal: number }) {
  const threshold = useCatalog().settings.freeShippingThreshold;
  if (threshold <= 0) return null; // free shipping is switched off
  const remaining = Math.max(0, threshold - subtotal);
  const pct = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;
  return (
    <div className={styles.meter}>
      <p className="mono">
        {remaining > 0 ? (
          <>
            {formatPrice(remaining)} away from free shipping
          </>
        ) : (
          <>Free shipping unlocked ✳</>
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
