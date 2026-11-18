import { readDB } from "@/server/db";
import { getImage } from "@/data/products";
import { InventoryEditor, type InventoryRow } from "@/components/admin/InventoryEditor";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const db = await readDB();
  const catName = (id: string) => db.categories.find((c) => c.id === id)?.name ?? "(no category)";
  const rows: InventoryRow[] = [...db.products]
    .sort((a, b) => a.rank - b.rank)
    .map((p) => {
      const img = getImage(p, "front");
      return {
        slug: p.slug,
        name: p.name,
        category: catName(p.categoryId),
        image: img.cutout ?? img.src,
        active: p.active,
        sizes: p.sizes,
        soldOut: p.soldOut,
        stock: p.stock ?? {},
      };
    });
  const units = rows.reduce((n, r) => n + Object.values(r.stock).reduce((a, b) => a + (b ?? 0), 0), 0);

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Inventory</h1>
          <p>
            Stock per size · {units} units tracked across {rows.length} products
          </p>
        </div>
      </header>
      {rows.length === 0 ? <p className={`${styles.card} ${styles.empty}`}>Add products first.</p> : <InventoryEditor rows={rows} />}
    </>
  );
}
