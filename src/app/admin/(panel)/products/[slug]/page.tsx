import Link from "next/link";
import { notFound } from "next/navigation";
import { readDB } from "@/server/db";
import { ProductEditor } from "@/components/admin/ProductEditor";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await readDB();
  const product = db.products.find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <>
      <header className={styles.head}>
        <div>
          <Link href="/admin/products" className={`${styles.crumb} mono`}>
            ← Products
          </Link>
          <h1>{product.name}</h1>
        </div>
      </header>
      <ProductEditor key={product.slug} initial={product} categories={[...db.categories].sort((a, b) => a.order - b.order)} />
    </>
  );
}
