import { redirect } from "next/navigation";
import { adminPassword, isAdmin } from "@/server/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const configured = adminPassword() !== null;
  return (
    <div className={styles.login}>
      <div className={`${styles.card} ${styles.loginCard}`}>
        <div className={styles.head} style={{ marginBottom: 0 }}>
          <div>
            <h1>DRAVX</h1>
            <p>Store dashboard</p>
          </div>
        </div>
        {configured ? (
          <LoginForm />
        ) : (
          <p className={styles.error}>Set the ADMIN_PASSWORD environment variable on the server to enable the dashboard.</p>
        )}
      </div>
    </div>
  );
}
