import { readDB } from "@/server/db";
import { SettingsForm } from "@/components/admin/SettingsForm";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const db = await readDB();
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Settings</h1>
          <p>Brand, contact and store switches</p>
        </div>
      </header>
      <SettingsForm settings={db.settings} />
    </>
  );
}
