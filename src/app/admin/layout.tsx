import type { Metadata } from "next";
import styles from "@/components/admin/Admin.module.css";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Dashboard" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}
