import { redirect } from "next/navigation";
import { isAdmin } from "@/server/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className={styles.login}>
      <div className={`${styles.card} ${styles.loginCard}`}>
        <div className={styles.head} style={{ marginBottom: 0 }}>
          <div>
            <h1>DRAVX</h1>
            <p>Store dashboard</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
