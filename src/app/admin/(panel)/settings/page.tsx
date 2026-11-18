import { readDB } from "@/server/db";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { usingDefaultPassword } from "@/server/auth";
import { fmtDate } from "@/components/admin/bits";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const db = await readDB();
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Settings</h1>
          <p>Brand, contact, store switches and password</p>
        </div>
      </header>
      <div className={`${styles.stack} ${styles.narrow}`}>
        <SettingsForm settings={db.settings} />
        <PasswordForm isDefault={await usingDefaultPassword()} changedAt={db.admin?.changedAt ? fmtDate(db.admin.changedAt) : undefined} />
      </div>
    </>
  );
}
