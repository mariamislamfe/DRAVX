import Link from "next/link";
import { readDB } from "@/server/db";
import { setProductActive } from "@/server/admin";
import { formatPrice } from "@/config/brand";
import { getImage } from "@/data/products";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const db = await readDB();
  const cats = [...db.categories].sort((a, b) => a.order - b.order);
  const list = db.products.filter((p) => !cat || p.categoryId === cat).sort((a, b) => a.rank - b.rank);
  const catName = (id: string) => db.categories.find((c) => c.id === id)?.name ?? "(no category)";

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Products</h1>
          <p>{db.products.length} products · prices, sizes, stock and photos</p>
        </div>
        <Link href="/admin/products/new" className={styles.btn}>
          + New product
        </Link>
      </header>

      <div className={styles.filters}>
        <Link href="/admin/products" aria-current={!cat ? "page" : undefined}>
          All
        </Link>
        {cats.map((c) => (
          <Link key={c.id} href={`/admin/products?cat=${c.id}`} aria-current={cat === c.id ? "page" : undefined}>
            {c.name} · {db.products.filter((p) => p.categoryId === c.id).length}
          </Link>
        ))}
      </div>

      <div className={styles.tableWrap}>
        {list.length === 0 ? (
          <p className={styles.empty}>No products here yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const img = getImage(p, "front");
                const toggle = setProductActive.bind(null, p.slug, !p.active);
                const out = p.soldOut.length;
                return (
                  <tr key={p.slug}>
                    <td style={{ width: 64 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {img.cutout || img.src ? <img src={img.cutout ?? img.src} alt="" className={styles.thumb} /> : <span className={styles.thumb} />}
                    </td>
                    <td>
                      <Link href={`/admin/products/${p.slug}`} className={styles.rowLink}>
                        {p.name}
                      </Link>
                      <div className={styles.muted}>/{p.slug}</div>
                    </td>
                    <td>{catName(p.categoryId)}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      {out === 0 ? (
                        <span className={styles.muted}>All sizes</span>
                      ) : out >= p.sizes.length ? (
                        <span className={styles.pill} data-s="cancelled">
                          Sold out
                        </span>
                      ) : (
                        <span className={styles.muted}>{p.soldOut.join(", ")} out</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.pill} data-s={p.active ? "delivered" : "off"}>
                        {p.active ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions} style={{ justifyContent: "flex-end" }}>
                        <form action={toggle}>
                          <button type="submit" className={`${styles.btnGhost} ${styles.btnSm}`}>
                            {p.active ? "Hide" : "Publish"}
                          </button>
                        </form>
                        <Link href={`/admin/products/${p.slug}`} className={`${styles.btnGhost} ${styles.btnSm}`}>
                          Edit
                        </Link>
                      </div>
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
