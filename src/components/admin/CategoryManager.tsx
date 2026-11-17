"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCategory, saveCategory } from "@/server/admin";
import type { Category } from "@/data/schema";
import styles from "./Admin.module.css";

type Row = Category & { products: number; templates: number };
const blank = (order: number): Category => ({ id: "", name: "", description: "", order, active: true });

export function CategoryManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ originalId?: string; data: Category } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    start(async () => {
      const res = await saveCategory({ ...editing.data, originalId: editing.originalId });
      if (!res.ok) return setError(res.error);
      setEditing(null);
      router.refresh();
    });
  };

  const remove = (c: Row) => {
    if (!window.confirm(`Delete “${c.name}”?`)) return;
    setError(null);
    start(async () => {
      const res = await deleteCategory(c.id);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  };

  const set = (p: Partial<Category>) => setEditing((s) => (s ? { ...s, data: { ...s.data, ...p } } : s));

  return (
    <div className={styles.split}>
      <div className={styles.tableWrap}>
        {rows.length === 0 ? (
          <p className={styles.empty}>No categories yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Name</th>
                <th>ID</th>
                <th>Products</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className={styles.muted}>{c.order}</td>
                  <td>
                    <strong>{c.name}</strong>
                    {c.description && <div className={styles.muted}>{c.description}</div>}
                  </td>
                  <td className={styles.muted}>
                    <code>{c.id}</code>
                  </td>
                  <td>
                    <Link href={`/admin/products?cat=${c.id}`} className={styles.rowLink}>
                      {c.products}
                    </Link>
                    {c.templates > 0 && <span className={styles.muted}> · {c.templates} custom</span>}
                  </td>
                  <td>
                    <span className={styles.pill} data-s={c.active ? "delivered" : "off"}>
                      {c.active ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions} style={{ justifyContent: "flex-end" }}>
                      <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => setEditing({ originalId: c.id, data: { ...c } })}>
                        Edit
                      </button>
                      <button type="button" className={`${styles.btnDanger} ${styles.btnSm}`} onClick={() => remove(c)} disabled={pending}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <section className={styles.card}>
        {editing ? (
          <form onSubmit={submit} className={styles.stack}>
            <h2 className={styles.cardTitle}>{editing.originalId ? "Edit category" : "New category"}</h2>
            <label className={styles.field}>
              <span>Name</span>
              <input value={editing.data.name} onChange={(e) => set({ name: e.target.value })} required placeholder="Sweatpants" autoFocus />
            </label>
            <label className={styles.field}>
              <span>ID (used in links)</span>
              <input value={editing.data.id} onChange={(e) => set({ id: e.target.value })} placeholder="auto from name" />
              <small>Shop link: /shop?cat={editing.data.id || "…"}</small>
            </label>
            <label className={styles.field}>
              <span>Description</span>
              <textarea rows={2} value={editing.data.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Sort order</span>
              <input type="number" value={editing.data.order} onChange={(e) => set({ order: Number(e.target.value) })} />
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={editing.data.active} onChange={(e) => set({ active: e.target.checked })} />
              Visible in the store
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <button type="submit" className={styles.btn} disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </button>
              <button type="button" className={styles.btnGhost} onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.stack}>
            <h2 className={styles.cardTitle}>Add a category</h2>
            <p className={styles.muted}>Create the category first, then add products to it from Products → New product.</p>
            {error && <p className={styles.error}>{error}</p>}
            <button type="button" className={styles.btn} onClick={() => setEditing({ data: blank((rows.at(-1)?.order ?? 0) + 1) })}>
              + New category
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
