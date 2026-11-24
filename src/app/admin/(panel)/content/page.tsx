import { readDB } from "@/server/db";
import { TextEditor } from "@/components/admin/TextEditor";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Site text" };

export default async function ContentPage() {
  const db = await readDB();
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Site text</h1>
          <p>Every word on the store, page by page. Product names and descriptions are edited under Products.</p>
        </div>
      </header>
      <div className={styles.narrow}>
        <TextEditor text={db.settings.text ?? {}} />
      </div>
    </>
  );
}
