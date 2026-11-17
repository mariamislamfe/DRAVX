"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Admin.module.css";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/customizer", label: "Customizer" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ newOrders, unread }: { newOrders: number; unread: number }) {
  const path = usePathname();
  const badge: Record<string, number> = { "/admin/orders": newOrders, "/admin/notifications": unread };
  return (
    <nav className={styles.nav} aria-label="Dashboard">
      {LINKS.map((l) => {
        const on = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        const n = badge[l.href] ?? 0;
        return (
          <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}>
            {l.label}
            {n > 0 && (
              <span className={styles.badge} aria-label={`${n} new`}>
                {n}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
