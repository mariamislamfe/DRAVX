import Link from "next/link";
import { readDB } from "@/server/db";
import { TemplateEditor } from "@/components/admin/TemplateEditor";
import { newTemplate } from "@/components/admin/defaults";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "New customizer base" };

export default async function NewTemplatePage() {
  const db = await readDB();
  const categories = [...db.categories].sort((a, b) => a.order - b.order);
  return (
    <>
      <header className={styles.head}>
        <div>
          <Link href="/admin/customizer" className={`${styles.crumb} mono`}>
            ← Customizer
          </Link>
          <h1>New base</h1>
          <p>Upload a blank mockup for each side, then mark where the print goes.</p>
        </div>
      </header>
      <TemplateEditor isNew initial={newTemplate(categories[0]?.id ?? "")} categories={categories} />
    </>
  );
}
