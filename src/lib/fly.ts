"use client";

import { gsap, prefersReducedMotion } from "./gsap";
import { useUI } from "./store";

/**
 * Flies a small token from `from` to the header bag, then bumps the counter.
 * Gives add-to-cart a physical, satisfying arc.
 */
export function flyToCart(from: Element | null, color = "#2d6bff") {
  const target = document.querySelector("[data-cart-target]");
  const done = () => useUI.getState().pulse();
  if (!from || !target || prefersReducedMotion()) return done();

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement("div");
  Object.assign(dot.style, {
    position: "fixed",
    left: `${a.left + a.width / 2 - 14}px`,
    top: `${a.top + a.height / 2 - 14}px`,
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: color,
    zIndex: "1002",
    pointerEvents: "none",
    boxShadow: "0 0 0 2px #ebe7de",
  });
  document.body.appendChild(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);

  gsap
    .timeline({ onComplete: () => (dot.remove(), done()) })
    .fromTo(dot, { scale: 0 }, { scale: 1.2, duration: 0.25, ease: "back.out(3)" })
    .to(dot, { x: dx, duration: 0.75, ease: "power2.inOut" }, 0.15)
    .to(dot, { y: dy, duration: 0.75, ease: "back.in(1.4)" }, 0.15)
    .to(dot, { scale: 0.35, duration: 0.75, ease: "power2.in" }, 0.15);
}
