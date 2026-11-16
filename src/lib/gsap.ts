"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.9 });
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** Brand easing vocabulary — keep motion consistent across the site. */
export const EASE = {
  out: "power3.out",
  inOut: "power3.inOut",
  expo: "expo.out",
  snap: "back.out(1.6)",
} as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Split text into per-character spans (accessible: original text kept in aria-label). */
export function splitChars(el: HTMLElement) {
  if (el.dataset.split === "1") return Array.from(el.querySelectorAll<HTMLElement>(".ch"));
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);
  el.innerHTML = "";
  const chars: HTMLElement[] = [];
  text.split(" ").forEach((word, wi, arr) => {
    const w = document.createElement("span");
    w.className = "wd";
    w.setAttribute("aria-hidden", "true");
    for (const ch of word) {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch;
      w.appendChild(s);
      chars.push(s);
    }
    el.appendChild(w);
    if (wi < arr.length - 1) el.appendChild(document.createTextNode(" "));
  });
  el.dataset.split = "1";
  return chars;
}

export { gsap, ScrollTrigger, useGSAP };
