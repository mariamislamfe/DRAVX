import Link from "next/link";
import { readDB } from "@/server/db";
import { formatPrice } from "@/config/brand";
import { INTEGRATIONS } from "@/data/integrations";
import { PAYMENT_LABEL, PAYMENT_METHODS } from "@/data/schema";
import { PaymentsForm } from "@/components/admin/PaymentsForm";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const db = await readDB();
  const live = db.orders.filter((o) => o.status !== "cancelled");
  const gateways = INTEGRATIONS.filter((p) => p.kind === "payment");
  const connected = gateways.filter((g) => db.integrations[g.id]?.enabled);

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Payments</h1>
          <p>How customers can pay at checkout</p>
        </div>
      </header>

      <div className={styles.split}>
        <PaymentsForm payments={db.settings.payments} />

        <div className={styles.stack}>
          <section className={styles.card}>
            <h2>Collected by method</h2>
            <dl className={styles.kv}>
              {PAYMENT_METHODS.map((m) => {
                const list = live.filter((o) => (o.payment ?? "cod") === m);
                return (
                  <div key={m} style={{ display: "contents" }}>
                    <dt>{PAYMENT_LABEL[m]}</dt>
                    <dd className={styles.num}>
                      {formatPrice(list.reduce((s, o) => s + o.total, 0))} · {list.length}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className={styles.card}>
            <h2>Online card payments</h2>
            {connected.length ? (
              <p>
                Connected: <strong>{connected.map((g) => g.name).join(", ")}</strong>. Card checkout goes live once the gateway&apos;s payment
                flow is wired to this store.
              </p>
            ) : (
              <p className={styles.muted}>Connect a payment gateway (Paymob, Fawry, Kashier, Stripe) to take cards and wallets online.</p>
            )}
            <Link href="/admin/integrations" className={`${styles.btnGhost} ${styles.btnSm}`} style={{ marginTop: 12 }}>
              Open integrations →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
