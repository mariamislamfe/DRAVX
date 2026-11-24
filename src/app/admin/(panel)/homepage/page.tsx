import { readDB } from "@/server/db";
import { HomeEditor } from "@/components/admin/HomeEditor";
import { DEFAULT_HOME } from "@/data/schema";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Homepage" };

export default async function HomepagePage() {
  const db = await readDB();
  const products = [...db.products].sort((a, b) => a.rank - b.rank).map((p) => ({ slug: p.slug, name: p.name, active: p.active }));
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Homepage</h1>
          <p>Hero products, section order and full-width video sections</p>
        </div>
      </header>
      <div className={styles.narrow}>
        <HomeEditor home={db.settings.home ?? DEFAULT_HOME} products={products} />
      </div>
    </>
  );
}
