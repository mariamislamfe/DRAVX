import { readDB } from "@/server/db";
import { getImage, type ProductColor } from "@/data/products";
import { InventoryEditor, type InventoryRow } from "@/components/admin/InventoryEditor";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const db = await readDB();
  const catName = (id: string) => db.categories.find((c) => c.id === id)?.name ?? "(no category)";
  const rows: InventoryRow[] = [...db.products]
    .sort((a, b) => a.rank - b.rank)
    .flatMap((p) => {
      const row = (color?: ProductColor): InventoryRow => {
        const img = getImage(p, "front", undefined, color?.id);
        return {
          key: color ? `${p.slug}|${color.id}` : p.slug,
          slug: p.slug,
          name: p.name,
          color: color ? { name: color.name, hex: color.hex } : undefined,
          category: catName(p.categoryId),
          image: img.cutout ?? img.src,
          active: p.active,
          sizes: p.sizes,
          soldOut: color ? color.soldOut ?? [] : p.soldOut,
          stock: (color ? color.stock : p.stock) ?? {},
        };
      };
      return p.colors?.length ? p.colors.map(row) : [row()];
    });
  const units = rows.reduce((n, r) => n + Object.values(r.stock).reduce((a, b) => a + (b ?? 0), 0), 0);

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Inventory</h1>
          <p>
            Stock per size and colour · {units} units tracked across {new Set(rows.map((r) => r.slug)).size} products
          </p>
        </div>
      </header>
      {rows.length === 0 ? <p className={`${styles.card} ${styles.empty}`}>Add products first.</p> : <InventoryEditor rows={rows} />}
    </>
  );
}
