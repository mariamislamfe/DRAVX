import { BRAND, formatPrice } from "@/config/brand";
import styles from "./Cart.module.css";

export function ShippingMeter({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, BRAND.freeShippingThreshold - subtotal);
  const pct = Math.min(100, (subtotal / BRAND.freeShippingThreshold) * 100);
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
