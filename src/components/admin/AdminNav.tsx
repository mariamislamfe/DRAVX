"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Admin.module.css";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/customizer", label: "Customizer" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ newOrders }: { newOrders: number }) {
  const path = usePathname();
  return (
    <nav className={styles.nav} aria-label="Dashboard">
      {LINKS.map((l) => {
        const on = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}>
            {l.label}
            {l.href === "/admin/orders" && newOrders > 0 && <span className={styles.badge}>{newOrders}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
