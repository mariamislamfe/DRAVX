import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { readDB } from "@/server/db";
import { logout } from "@/server/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { NoticeWatcher } from "@/components/admin/NoticeWatcher";
import styles from "@/components/admin/Admin.module.css";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const db = await readDB();
  const newOrders = db.orders.filter((o) => o.status === "pending").length;
  const notices = db.notifications ?? [];
  const unread = notices.filter((n) => !n.read).length;
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <Link href="/admin" className={styles.brand}>
          DRAVX <small>admin</small>
        </Link>
        <AdminNav newOrders={newOrders} unread={unread} />
        <NoticeWatcher initialLatest={notices[0]?.at} />
        <div className={styles.sideFoot}>
          <Link href="/" target="_blank">
            View store ↗
          </Link>
          <form action={logout}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <div className={styles.main}>
        {children}
      </div>
    </div>
  );
}
