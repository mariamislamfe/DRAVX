"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Notice } from "@/data/schema";
import styles from "./Admin.module.css";

const POLL_MS = 20_000;
const SOUND_KEY = "dravx-admin-sound";

type Payload = { unread: number; newOrders: number; latest: Notice[] };

/**
 * Runs on every dashboard page. Polls for notifications and, when a new one
 * arrives: plays a chime, shows a desktop notification (if allowed), puts the
 * unread count in the tab title and refreshes the page data.
 */
export function NoticeWatcher({ initialLatest }: { initialLatest?: string }) {
  const router = useRouter();
  const seen = useRef(initialLatest ?? "");
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("unsupported");
  const [sound, setSound] = useState(true);
  const soundRef = useRef(true);
  soundRef.current = sound;
  const unreadRef = useRef(0);

  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    try {
      setSound(localStorage.getItem(SOUND_KEY) !== "off");
    } catch {}
  }, []);

  const poll = useCallback(async () => {
    let data: Payload;
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!res.ok) return;
      data = await res.json();
    } catch {
      return; // offline for a moment; try again next tick
    }
    unreadRef.current = data.unread;
    applyTitle(data.unread);

    const fresh = data.latest.filter((n) => n.at > seen.current);
    if (data.latest[0] && data.latest[0].at > seen.current) seen.current = data.latest[0].at;
    if (!fresh.length) return;

    if (soundRef.current) chime();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      for (const n of fresh.slice(0, 3)) {
        const note = new Notification(n.title, { body: n.body, tag: n.id, icon: "/icon.png" });
        note.onclick = () => {
          window.focus();
          router.push(n.href);
          note.close();
        };
      }
    }
    router.refresh();
  }, [router]);

  // page navigations reset document.title; put the unread count back
  useEffect(() => {
    const mo = new MutationObserver(() => applyTitle(unreadRef.current));
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll]);

  const enable = async () => {
    if (typeof Notification === "undefined") return;
    setPerm(await Notification.requestPermission());
    chime(); // also unlocks audio on browsers that need a user gesture
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {}
    if (next) chime();
  };

  return (
    <div className={styles.alerts}>
      {perm === "default" && (
        <button type="button" onClick={enable}>
          🔔 Turn on order alerts
        </button>
      )}
      {perm === "denied" && <span title="Allow notifications for this site in your browser settings">Desktop alerts blocked</span>}
      <button type="button" onClick={toggleSound} aria-pressed={sound}>
        {sound ? "🔊 Sound on" : "🔈 Sound off"}
      </button>
    </div>
  );
}

function applyTitle(unread: number) {
  const base = document.title.replace(/^\(\d+\)\s*/, "");
  const next = unread ? `(${unread}) ${base}` : base;
  if (document.title !== next) document.title = next;
}

let ctx: AudioContext | null = null;
/** Two-note chime, no audio file needed. */
function chime() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    [880, 1318.5].forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const s = t0 + i * 0.16;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.25, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.5);
      o.connect(g).connect(ctx!.destination);
      o.start(s);
      o.stop(s + 0.55);
    });
  } catch {}
}
