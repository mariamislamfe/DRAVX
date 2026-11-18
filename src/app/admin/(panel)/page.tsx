import Link from "next/link";
import { readDB } from "@/server/db";
import { formatPrice } from "@/config/brand";
import { CustomPill, StatusPill, fmtDate } from "@/components/admin/bits";
import styles from "@/components/admin/Admin.module.css";

export default async function Overview() {
  const db = await readDB();
  const live = db.orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const since = Date.now() - 30 * 864e5;
  const month = live.filter((o) => +new Date(o.createdAt) >= since);
  const pending = db.orders.filter((o) => o.status === "pending").length;
  const toPrint = db.orders.filter((o) => ["confirmed", "in_production"].includes(o.status) && o.items.some((i) => i.kind === "custom")).length;
  const recent = db.orders.slice(0, 8);

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Dashboard</h1>
          <p>Store at a glance</p>
        </div>
        <div className={styles.actions}>
          <Link href="/admin/products/new" className={styles.btnGhost}>
            + Product
          </Link>
          <Link href="/admin/orders" className={styles.btn}>
            Orders
          </Link>
        </div>
      </header>

      <div className={styles.stats}>
        <Link href="/admin/orders?status=pending" className={`${styles.card} ${styles.stat}`}>
          <strong>{pending}</strong>
          <span>New orders to confirm</span>
        </Link>
        <Link href="/admin/orders?type=custom" className={`${styles.card} ${styles.stat}`}>
          <strong>{toPrint}</strong>
          <span>Custom orders to print</span>
        </Link>
        <div className={`${styles.card} ${styles.stat}`}>
          <strong>{formatPrice(month.reduce((s, o) => s + o.total, 0))}</strong>
          <span>Last 30 days · {month.length} orders</span>
        </div>
        <div className={`${styles.card} ${styles.stat}`}>
          <strong>{formatPrice(revenue)}</strong>
          <span>All time · {live.length} orders</span>
        </div>
        <Link href="/admin/products" className={`${styles.card} ${styles.stat}`}>
          <strong>{db.products.filter((p) => p.active).length}</strong>
          <span>
            Live products · {db.categories.length} {db.categories.length === 1 ? "category" : "categories"}
          </span>
        </Link>
      </div>

      <section className={styles.card}>
        <h2>Latest orders</h2>
        {recent.length === 0 ? (
          <p className={styles.empty}>No orders yet. They appear here as soon as someone checks out.</p>
        ) : (
          <div className={styles.tableFlat}>
            <table className={`${styles.table} ${styles.cards}`}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className={styles.num}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className={styles.rowLink}>
                        {o.number}
                      </Link>{" "}
                      {o.items.some((i) => i.kind === "custom") && <CustomPill />}
                    </td>
                    <td className={styles.statusCell}>
                      <StatusPill status={o.status} />
                    </td>
                    <td data-label="Customer">{o.customer.name}</td>
                    <td className={styles.muted} data-label="Date">
                      {fmtDate(o.createdAt)}
                    </td>
                    <td className={`${styles.num} ${styles.cardTotal}`} data-label="Total">
                      {formatPrice(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
