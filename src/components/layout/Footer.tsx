"use client";

import { useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { BRAND } from "@/config/brand";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Logo } from "@/components/brand/Logo";
import styles from "./Footer.module.css";

export function Footer() {
  const root = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "done">("idle");

  useGSAP(
    () => {
      gsap.fromTo(
        `.${styles.mark}`,
        { clipPath: "inset(0 0 100% 0)", yPercent: 18 },
        {
          clipPath: "inset(0 0 0% 0)",
          yPercent: 0,
          ease: "power4.out",
          duration: 1.4,
          scrollTrigger: { trigger: `.${styles.markWrap}`, start: "top 95%" },
        }
      );
    },
    { scope: root }
  );

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // NOTE: newsletter provider not connected — this only confirms in the UI.
    setState("done");
  };

  return (
    <footer ref={root} className={`${styles.footer} on-ink`}>
      <div className={`${styles.top} wrap`}>
        <div className={styles.signup}>
          <h2 className="display">
            Get the next drop <span className="serif">before</span> it gets loud.
          </h2>
          {state === "idle" ? (
            <form onSubmit={submit} className={styles.form}>
              <label htmlFor="ft-email" className="sr-only">
                Email address
              </label>
              <input id="ft-email" type="email" required placeholder="you@email.com" autoComplete="email" />
              <button type="submit" className="btn">
                Join <span className="arrow">→</span>
              </button>
            </form>
          ) : (
            <p className={`${styles.done} mono`} role="status">
              ✳ You&apos;re on the list (demo — no email provider connected yet).
            </p>
          )}
        </div>

        <nav className={styles.cols} aria-label="Footer">
          <div>
            <p className="mono">Shop</p>
            <TransitionLink href="/shop" className="link-u">All hoodies</TransitionLink>
            <TransitionLink href="/shop?world=daydream" className="link-u">Daydream</TransitionLink>
            <TransitionLink href="/shop?world=nightshift" className="link-u">Nightshift</TransitionLink>
          </div>
          <div>
            <p className="mono">Brand</p>
            <TransitionLink href="/about" className="link-u">Manifesto</TransitionLink>
            <TransitionLink href="/cart" className="link-u">Your bag</TransitionLink>
            <a href={`mailto:${BRAND.email}`} className="link-u">Contact</a>
          </div>
          <div>
            <p className="mono">Follow</p>
            <a href="#" className="link-u">Instagram</a>
            <a href="#" className="link-u">TikTok</a>
          </div>
        </nav>
      </div>

      <div className={styles.markWrap} aria-hidden="true">
        <Logo variant="wordmark" className={styles.mark} width="100%" decorative />
      </div>

      <div className={`${styles.bottom} wrap mono`}>
        <span>© 2026 {BRAND.name}</span>
        <span>Front: quiet. Back: loud.</span>
        <span>Payments not yet connected</span>
      </div>
    </footer>
  );
}
