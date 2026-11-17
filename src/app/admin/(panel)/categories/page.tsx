import { readDB } from "@/server/db";
import { CategoryManager } from "@/components/admin/CategoryManager";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const db = await readDB();
  const rows = [...db.categories]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      ...c,
      products: db.products.filter((p) => p.categoryId === c.id).length,
      templates: db.templates.filter((t) => t.categoryId === c.id).length,
    }));
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Categories</h1>
          <p>Group products in the shop (Hoodies, Sweatpants, Tees…). Empty or hidden categories don&apos;t show in the store.</p>
        </div>
      </header>
      <CategoryManager rows={rows} />
    </>
  );
}
