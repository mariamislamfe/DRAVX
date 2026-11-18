import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { readDB } from "@/server/db";
import { logout } from "@/server/admin";
import { AdminShell } from "@/components/admin/AdminNav";
import { NoticeWatcher } from "@/components/admin/NoticeWatcher";
import { Icon } from "@/components/admin/icons";
import styles from "@/components/admin/Admin.module.css";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const db = await readDB();
  const newOrders = db.orders.filter((o) => o.status === "pending").length;
  const notices = db.notifications ?? [];
  const unread = notices.filter((n) => !n.read).length;
  return (
    <AdminShell
      brand={db.settings.brand.name}
      newOrders={newOrders}
      unread={unread}
      footer={
        <>
          <NoticeWatcher initialLatest={notices[0]?.at} />
          <Link href="/" target="_blank" className={styles.footLink}>
            <Icon name="external" size={18} />
            View store
          </Link>
          <form action={logout}>
            <button type="submit" className={styles.footLink}>
              <Icon name="logout" size={18} />
              Sign out
            </button>
          </form>
        </>
      }
    >
      {children}
    </AdminShell>
  );
}
