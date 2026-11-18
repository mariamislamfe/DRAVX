import Link from "next/link";
import { readDB } from "@/server/db";
import { INTEGRATIONS } from "@/data/integrations";
import { ShippingForm } from "@/components/admin/ShippingForm";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Shipping" };

export default async function ShippingPage() {
  const db = await readDB();
  const couriers = INTEGRATIONS.filter((p) => p.kind === "shipping");
  const toShip = db.orders.filter((o) => o.status === "confirmed" || o.status === "in_production").length;
  const onWay = db.orders.filter((o) => o.status === "shipped").length;

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Shipping</h1>
          <p>Delivery fees, zones and policies</p>
        </div>
      </header>

      <div className={styles.split}>
        <ShippingForm settings={db.settings} />

        <div className={styles.stack}>
          <section className={styles.card}>
            <h2>Deliveries</h2>
            <dl className={styles.kv}>
              <dt>Ready to ship</dt>
              <dd className={styles.num}>
                <Link href="/admin/orders?status=confirmed" className={styles.rowLink}>
                  {toShip}
                </Link>
              </dd>
              <dt>On the way</dt>
              <dd className={styles.num}>
                <Link href="/admin/orders?status=shipped" className={styles.rowLink}>
                  {onWay}
                </Link>
              </dd>
            </dl>
          </section>

          <section className={styles.card}>
            <h2>Shipping companies</h2>
            <ul className={styles.timeline}>
              {couriers.map((c) => {
                const st = db.integrations[c.id];
                return (
                  <li key={c.id}>
                    <span>{c.name}</span>
                    <span className={styles.pill} data-s={st?.enabled ? "delivered" : st ? "in_production" : "off"}>
                      {st?.enabled ? "Connected" : st ? "Saved, off" : "Not connected"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link href="/admin/integrations" className={`${styles.btnGhost} ${styles.btnSm}`} style={{ marginTop: 12 }}>
              Manage in Integrations →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
