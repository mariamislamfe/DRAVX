import Link from "next/link";
import { readDB } from "@/server/db";
import { deleteDiscount, setDiscountActive } from "@/server/admin";
import { formatPrice } from "@/config/brand";
import type { Discount } from "@/data/schema";
import { DiscountForm } from "@/components/admin/DiscountForm";
import { ConfirmButton } from "@/components/admin/ClientBits";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Discounts" };

function describe(d: Discount) {
  const what = d.type === "percent" ? `${d.value}% off` : d.type === "fixed" ? `${formatPrice(d.value)} off` : "Free shipping";
  return d.minSubtotal > 0 ? `${what} over ${formatPrice(d.minSubtotal)}` : what;
}

function state(d: Discount): { label: string; s: string } {
  if (!d.active) return { label: "Off", s: "off" };
  if (d.expiresAt && new Date().toISOString().slice(0, 10) > d.expiresAt) return { label: "Expired", s: "cancelled" };
  if (d.maxUses > 0 && d.uses >= d.maxUses) return { label: "Used up", s: "cancelled" };
  return { label: "Active", s: "delivered" };
}

export default async function DiscountsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const db = await readDB();
  const list = db.discounts;
  const editing = edit ? list.find((d) => d.code === edit) : undefined;
  const saved = db.orders.filter((o) => o.discount && o.status !== "cancelled").reduce((s, o) => s + (o.discount?.amount ?? 0), 0);

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Discounts</h1>
          <p>
            Codes customers enter at checkout · {formatPrice(saved)} given so far
          </p>
        </div>
      </header>

      <div className={styles.split}>
        <div className={styles.tableWrap}>
          {list.length === 0 ? (
            <p className={styles.empty}>No codes yet. Create one on the right.</p>
          ) : (
            <table className={`${styles.table} ${styles.cards}`}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Discount</th>
                  <th>Used</th>
                  <th>Expires</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((d) => {
                  const st = state(d);
                  return (
                    <tr key={d.code}>
                      <td>
                        <Link href={`/admin/discounts?edit=${encodeURIComponent(d.code)}`} className={`${styles.rowLink} mono`} style={{ fontSize: "0.9rem" }}>
                          {d.code}
                        </Link>
                      </td>
                      <td className={styles.statusCell}>
                        <span className={styles.pill} data-s={st.s}>
                          {st.label}
                        </span>
                      </td>
                      <td data-label="Discount">{describe(d)}</td>
                      <td data-label="Used">
                        {d.uses}
                        {d.maxUses > 0 ? ` / ${d.maxUses}` : ""}
                      </td>
                      <td className={styles.muted} data-label="Expires">
                        {d.expiresAt ?? "Never"}
                      </td>
                      <td className={styles.full}>
                        <div className={`${styles.actions} ${styles.rowActions}`}>
                          <form action={setDiscountActive.bind(null, d.code, !d.active)}>
                            <button type="submit" className={`${styles.btnGhost} ${styles.btnSm}`}>
                              {d.active ? "Turn off" : "Turn on"}
                            </button>
                          </form>
                          <Link href={`/admin/discounts?edit=${encodeURIComponent(d.code)}`} className={`${styles.btnGhost} ${styles.btnSm}`}>
                            Edit
                          </Link>
                          <form action={deleteDiscount.bind(null, d.code)}>
                            <ConfirmButton className={`${styles.btnDanger} ${styles.btnSm}`} message={`Delete ${d.code}?`}>
                              Delete
                            </ConfirmButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <section className={styles.card}>
          <DiscountForm key={editing?.code ?? "new"} initial={editing} />
        </section>
      </div>
    </>
  );
}
