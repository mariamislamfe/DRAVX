import Link from "next/link";
import { readDB } from "@/server/db";
import { formatPrice } from "@/config/brand";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/data/schema";
import { CustomPill, StatusPill, fmtDate } from "@/components/admin/bits";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; type?: string }> }) {
  const sp = await searchParams;
  const db = await readDB();
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : null;
  const q = (sp.q ?? "").trim().toLowerCase();
  const customOnly = sp.type === "custom";
  const list = db.orders.filter(
    (o) =>
      (!status || o.status === status) &&
      (!customOnly || o.items.some((i) => i.kind === "custom")) &&
      (!q || [o.number, o.customer.name, o.customer.phone, o.customer.email ?? "", o.customer.city].some((v) => v.toLowerCase().includes(q)))
  );
  const href = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const merged: Record<string, string | undefined> = { status: status ?? undefined, q: sp.q, type: sp.type, ...p };
    Object.entries(merged).forEach(([k, v]) => v && u.set(k, v));
    const s = u.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };
  const count = (s: OrderStatus) => db.orders.filter((o) => o.status === s).length;

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Orders</h1>
          <p>{db.orders.length} total</p>
        </div>
      </header>

      <div className={styles.filters}>
        <Link href={href({ status: undefined })} aria-current={!status ? "page" : undefined}>
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={href({ status: s })} aria-current={status === s ? "page" : undefined}>
            {STATUS_LABEL[s]} · {count(s)}
          </Link>
        ))}
        <Link href={href({ type: customOnly ? undefined : "custom" })} aria-current={customOnly ? "page" : undefined}>
          Custom only
        </Link>
      </div>
      <form className={styles.search} role="search">
        {status && <input type="hidden" name="status" value={status} />}
        {customOnly && <input type="hidden" name="type" value="custom" />}
        <input type="search" name="q" defaultValue={sp.q} placeholder="Search name, phone, order #" aria-label="Search orders" />
      </form>

      <div className={styles.tableWrap}>
        {list.length === 0 ? (
          <p className={styles.empty}>No orders match.</p>
        ) : (
          <table className={`${styles.table} ${styles.cards}`}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Customer</th>
                <th>City</th>
                <th>Date</th>
                <th>Items</th>
                <th className={styles.num}>Total</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
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
                  <td data-label="Customer">
                    {o.customer.name}
                    <br />
                    <span className={styles.muted}>{o.customer.phone}</span>
                  </td>
                  <td data-label="City">{o.customer.city}</td>
                  <td className={styles.muted} data-label="Date">
                    {fmtDate(o.createdAt)}
                  </td>
                  <td data-label="Items">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td className={`${styles.num} ${styles.cardTotal}`} data-label="Total">
                    <strong>{formatPrice(o.total)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
