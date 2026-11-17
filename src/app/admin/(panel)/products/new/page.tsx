import Link from "next/link";
import { readDB } from "@/server/db";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { newProduct } from "@/components/admin/defaults";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "New product" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const db = await readDB();
  const categories = [...db.categories].sort((a, b) => a.order - b.order);
  return (
    <>
      <header className={styles.head}>
        <div>
          <Link href="/admin/products" className={`${styles.crumb} mono`}>
            ← Products
          </Link>
          <h1>New product</h1>
          <p>Stays hidden until you tick “Live in the store”.</p>
        </div>
      </header>
      <ProductEditor isNew initial={newProduct(categories.find((c) => c.id === cat)?.id ?? categories[0]?.id ?? "")} categories={categories} />
    </>
  );
}
