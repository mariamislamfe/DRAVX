import Link from "next/link";
import { notFound } from "next/navigation";
import { readDB } from "@/server/db";
import { TemplateEditor } from "@/components/admin/TemplateEditor";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Edit customizer base" };

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  const t = db.templates.find((x) => x.id === id);
  if (!t) notFound();
  return (
    <>
      <header className={styles.head}>
        <div>
          <Link href="/admin/customizer" className={`${styles.crumb} mono`}>
            ← Customizer
          </Link>
          <h1>{t.name}</h1>
        </div>
      </header>
      <TemplateEditor key={t.id} initial={t} categories={[...db.categories].sort((a, b) => a.order - b.order)} />
    </>
  );
}
