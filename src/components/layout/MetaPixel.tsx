"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/pixel";

/**
 * Loads Meta's fbevents.js once, inits every Pixel ID from Dashboard →
 * Settings and sends PageView on each route change. Storefront only.
 */
export function MetaPixel({ ids }: { ids: string[] }) {
  const path = usePathname();
  const search = useSearchParams();
  const ready = useRef(false);
  const key = ids.join(",");

  useEffect(() => {
    if (!ids.length || ready.current) return;
    type Q = ((...a: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: unknown };
    const w = window as unknown as { fbq?: Q; _fbq?: Q };
    if (!w.fbq) {
      // Meta's standard bootstrap: queue calls until the script arrives
      const q = ((...args: unknown[]) => {
        if (q.callMethod) q.callMethod(...args);
        else q.queue.push(args);
      }) as Q;
      q.push = q;
      q.loaded = true;
      q.version = "2.0";
      q.queue = [];
      w.fbq = q;
      w._fbq = q;
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }
    for (const id of ids) w.fbq!("init", id);
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (ids.length) track("PageView");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, search, key]);

  return null;
}
