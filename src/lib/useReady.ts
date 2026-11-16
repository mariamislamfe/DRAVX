"use client";

import { useEffect, useRef } from "react";
import { useUI } from "./store";

/**
 * Runs `fn` once, the first time the app is "ready" (preloader finished or
 * page-transition curtain is lifting). Use for entrance choreography.
 */
export function useOnReady(fn: () => void) {
  const phase = useUI((s) => s.phase);
  const done = useRef(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (phase === "ready" && !done.current) {
      done.current = true;
      fnRef.current();
    }
  }, [phase]);
}
