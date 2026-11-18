import Link from "next/link";
import { readDB } from "@/server/db";
import { formatPrice } from "@/config/brand";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Customizer" };

export default async function CustomizerAdmin() {
  const db = await readDB();
  const list = [...db.templates].sort((a, b) => a.order - b.order);
  const catName = (id: string) => db.categories.find((c) => c.id === id)?.name ?? "-";
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Customizer</h1>
          <p>The blank garments customers can put their own design on, at /customize.</p>
        </div>
        <Link href="/admin/customizer/new" className={styles.btn}>
          + New base
        </Link>
      </header>

      {!db.settings.customizerEnabled && (
        <p className={styles.warnBox}>
          The customizer is switched off for customers. Turn it on in <Link href="/admin/settings">Settings</Link>.
        </p>
      )}

      <div className={styles.tableWrap}>
        {list.length === 0 ? (
          <p className={styles.empty}>No bases yet.</p>
        ) : (
          <table className={`${styles.table} ${styles.cards}`}>
            <thead>
              <tr>
                <th />
                <th>Base</th>
                <th>Category</th>
                <th>Price</th>
                <th>Sides</th>
                <th>Colours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const sides = t.views.filter((v) => v.enabled);
                return (
                  <tr key={t.id}>
                    <td className={styles.thumbCell}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {sides[0] && <img src={sides[0].mockup} alt="" className={styles.thumb} />}
                    </td>
                    <td>
                      <Link href={`/admin/customizer/${t.id}`} className={styles.rowLink}>
                        {t.name}
                      </Link>
                    </td>
                    <td data-label="Category">{catName(t.categoryId)}</td>
                    <td data-label="Price">
                      {formatPrice(t.basePrice)}
                      <div className={styles.muted}>
                        {sides.map((v) => `+${formatPrice(v.printPrice)} ${v.side}`).join(" · ")}
                      </div>
                    </td>
                    <td data-label="Sides">{sides.map((v) => `${v.side} ${v.printWidthCm}cm`).join(", ")}</td>
                    <td data-label="Colours">
                      {t.colors.map((c) => (
                        <span key={c.id} className={styles.swatch} style={{ background: c.hex }} title={c.name} />
                      ))}
                    </td>
                    <td data-label="Status">
                      <span className={styles.pill} data-s={t.active ? "delivered" : "off"}>
                        {t.active ? "Live" : "Hidden"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
