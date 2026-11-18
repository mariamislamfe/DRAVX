import Link from "next/link";
import { readDB } from "@/server/db";
import { formatPrice } from "@/config/brand";
import { fmtDate } from "@/components/admin/bits";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Customers" };

type Row = {
  key: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  orders: number;
  spent: number;
  first: string;
  last: string;
};

/** Customers are built from orders, grouped by phone number. */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  const sp = await searchParams;
  const db = await readDB();
  const map = new Map<string, Row>();
  // orders are newest first, so the first one we see holds the latest details
  for (const o of db.orders) {
    const key = o.customer.phone.replace(/[^\d]/g, "").slice(-10) || o.customer.name.toLowerCase();
    const live = o.status !== "cancelled";
    const r = map.get(key);
    if (!r) {
      map.set(key, {
        key,
        name: o.customer.name,
        phone: o.customer.phone,
        email: o.customer.email,
        city: o.customer.city,
        orders: live ? 1 : 0,
        spent: live ? o.total : 0,
        first: o.createdAt,
        last: o.createdAt,
      });
    } else {
      if (live) {
        r.orders += 1;
        r.spent += o.total;
      }
      r.email ??= o.customer.email;
      if (o.createdAt < r.first) r.first = o.createdAt;
    }
  }
  const all = [...map.values()];
  const q = (sp.q ?? "").trim().toLowerCase();
  const list = all
    .filter((r) => !q || [r.name, r.phone, r.email ?? "", r.city].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => (sp.sort === "spent" ? b.spent - a.spent : sp.sort === "orders" ? b.orders - a.orders : b.last.localeCompare(a.last)));
  const repeat = all.filter((r) => r.orders > 1).length;
  const sortHref = (s?: string) => {
    const u = new URLSearchParams();
    if (sp.q) u.set("q", sp.q);
    if (s) u.set("sort", s);
    const str = u.toString();
    return str ? `/admin/customers?${str}` : "/admin/customers";
  };

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Customers</h1>
          <p>
            {all.length} customers · {repeat} ordered more than once
          </p>
        </div>
      </header>

      <div className={styles.filters}>
        <Link href={sortHref()} aria-current={!sp.sort ? "page" : undefined}>
          Latest
        </Link>
        <Link href={sortHref("spent")} aria-current={sp.sort === "spent" ? "page" : undefined}>
          Top spenders
        </Link>
        <Link href={sortHref("orders")} aria-current={sp.sort === "orders" ? "page" : undefined}>
          Most orders
        </Link>
      </div>
      <form className={styles.search} role="search">
        {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
        <input type="search" name="q" defaultValue={sp.q} placeholder="Search name, phone, email, city" aria-label="Search customers" />
      </form>

      <div className={styles.tableWrap}>
        {list.length === 0 ? (
          <p className={styles.empty}>{all.length ? "No customers match." : "Customers appear here after their first order."}</p>
        ) : (
          <table className={`${styles.table} ${styles.cards}`}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Orders</th>
                <th>Last order</th>
                <th className={styles.num}>Spent</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.key}>
                  <td className={styles.full}>
                    <Link href={`/admin/orders?q=${encodeURIComponent(r.phone)}`} className={styles.rowLink}>
                      {r.name}
                    </Link>
                    {r.email && <div className={styles.muted}>{r.email}</div>}
                  </td>
                  <td data-label="Phone">
                    <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>{r.phone}</a>
                  </td>
                  <td data-label="City">{r.city}</td>
                  <td data-label="Orders">{r.orders}</td>
                  <td className={styles.muted} data-label="Last order">
                    {fmtDate(r.last, false)}
                  </td>
                  <td className={`${styles.num} ${styles.cardTotal}`} data-label="Spent">
                    <strong>{formatPrice(r.spent)}</strong>
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
