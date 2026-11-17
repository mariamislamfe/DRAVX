import { readDB } from "@/server/db";
import { NoticeList } from "@/components/admin/NoticeList";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const db = await readDB();
  const list = db.notifications ?? [];
  const unread = list.filter((n) => !n.read).length;
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Notifications</h1>
          <p>{unread ? `${unread} unread` : "All caught up"}. New orders show up here and as alerts while the dashboard is open.</p>
        </div>
      </header>
      <NoticeList notices={list} />
    </>
  );
}
