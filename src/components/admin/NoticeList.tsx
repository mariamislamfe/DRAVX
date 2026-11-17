"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearNotices, markNoticesRead } from "@/server/admin";
import type { Notice } from "@/data/schema";
import { fmtDate } from "./bits";
import styles from "./Admin.module.css";

export function NoticeList({ notices }: { notices: Notice[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const unread = notices.some((n) => !n.read);
  const anyRead = notices.some((n) => n.read);

  const open = (n: Notice) =>
    start(async () => {
      if (!n.read) await markNoticesRead([n.id]);
      router.push(n.href);
    });

  if (!notices.length) return <p className={styles.empty}>No notifications yet. New orders will appear here.</p>;

  return (
    <div className={styles.stack}>
      <div className={styles.actions}>
        <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} disabled={pending || !unread} onClick={() => start(() => markNoticesRead())}>
          Mark all as read
        </button>
        <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} disabled={pending || !anyRead} onClick={() => start(() => clearNotices())}>
          Clear read
        </button>
      </div>
      <ul className={styles.notices}>
        {notices.map((n) => (
          <li key={n.id} data-unread={!n.read || undefined}>
            <button type="button" onClick={() => open(n)} disabled={pending}>
              <span className={styles.noticeDot} data-kind={n.kind} aria-hidden="true" />
              <span>
                <strong>{n.title}</strong>
                <span className={styles.muted}>{n.body}</span>
              </span>
              <time className={styles.muted} dateTime={n.at}>
                {fmtDate(n.at)}
              </time>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
