"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";
import styles from "./Admin.module.css";

type NavLink = { href: string; label: string; icon: IconName; badge?: "orders" | "notices" };
type Group = { title: string; links: NavLink[] };

/**
 * Standard dashboard menu. The four groups and their links are the base for
 * every store; project-specific pages (like Customizer) slot into the group
 * they belong to.
 */
const GROUPS: Group[] = [
  {
    title: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: "dashboard" },
      { href: "/admin/notifications", label: "Notifications", icon: "bell", badge: "notices" },
    ],
  },
  {
    title: "Sales",
    links: [
      { href: "/admin/orders", label: "Orders", icon: "orders", badge: "orders" },
      { href: "/admin/customers", label: "Customers", icon: "customers" },
      { href: "/admin/discounts", label: "Discounts", icon: "discounts" },
    ],
  },
  {
    title: "Catalogue",
    links: [
      { href: "/admin/products", label: "Products", icon: "products" },
      { href: "/admin/categories", label: "Categories", icon: "categories" },
      { href: "/admin/inventory", label: "Inventory", icon: "inventory" },
      { href: "/admin/customizer", label: "Customizer", icon: "customizer" },
    ],
  },
  {
    title: "Store",
    links: [
      { href: "/admin/payments", label: "Payments", icon: "payments" },
      { href: "/admin/shipping", label: "Shipping", icon: "shipping" },
      { href: "/admin/integrations", label: "Integrations", icon: "integrations" },
      { href: "/admin/settings", label: "Settings", icon: "settings" },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.links);

export function AdminShell({
  brand,
  newOrders,
  unread,
  footer,
  children,
}: {
  brand: string;
  newOrders: number;
  unread: number;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const counts = { orders: newOrders, notices: unread };
  const isOn = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));
  const current = ALL.find((l) => isOn(l.href));

  // close the drawer after navigating
  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={styles.shell} data-open={open || undefined}>
      <header className={styles.topbar}>
        <button type="button" className={styles.iconBtn} onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="admin-side">
          <Icon name="menu" />
        </button>
        <span className={styles.topTitle}>{current?.label ?? "Dashboard"}</span>
        <Link href="/admin/notifications" className={styles.iconBtn} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Icon name="bell" />
          {unread > 0 && <span className={styles.dot} />}
        </Link>
      </header>

      <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside id="admin-side" className={styles.side} aria-label="Dashboard menu">
        <div className={styles.sideHead}>
          <Link href="/admin" className={styles.brand}>
            {brand} <small>admin</small>
          </Link>
          <button type="button" className={`${styles.iconBtn} ${styles.closeBtn}`} onClick={() => setOpen(false)} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Dashboard">
          {GROUPS.map((g) => (
            <div key={g.title} className={styles.navGroup}>
              <p className={styles.navTitle}>{g.title}</p>
              {g.links.map((l) => {
                const on = isOn(l.href);
                const n = l.badge ? counts[l.badge] : 0;
                return (
                  <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}>
                    <Icon name={l.icon} />
                    <span>{l.label}</span>
                    {n > 0 && (
                      <span className={styles.badge} aria-label={`${n} new`}>
                        {n}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sideFoot}>{footer}</div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
