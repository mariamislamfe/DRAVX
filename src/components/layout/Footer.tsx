"use client";

import { useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { socialUrl, whatsappUrl } from "@/config/brand";
import { useCatalog } from "@/lib/catalog";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Logo } from "@/components/brand/Logo";
import styles from "./Footer.module.css";

export function Footer() {
  const root = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "done">("idle");
  const brand = useCatalog().settings.brand;
  const contact = [
    brand.email && { label: "Email", href: `mailto:${brand.email}` },
    brand.phone && { label: brand.phone, href: `tel:${brand.phone.replace(/[^\d+]/g, "")}` },
    whatsappUrl(brand.whatsapp) && { label: "WhatsApp", href: whatsappUrl(brand.whatsapp), external: true },
  ].filter(Boolean) as { label: string; href: string; external?: boolean }[];
  const social = (
    [
      ["Instagram", socialUrl("instagram", brand.instagram)],
      ["TikTok", socialUrl("tiktok", brand.tiktok)],
      ["Facebook", socialUrl("facebook", brand.facebook)],
    ] as const
  )
    .filter(([, href]) => href)
    .map(([label, href]) => ({ label, href }));

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
            <TransitionLink href="/customize" className="link-u">Customize</TransitionLink>
          </div>
          {contact.length > 0 && (
            <div>
              <p className="mono">Contact</p>
              {contact.map((c) => (
                <a key={c.label} href={c.href} className="link-u" {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {c.label}
                </a>
              ))}
            </div>
          )}
          {social.length > 0 && (
            <div>
              <p className="mono">Follow</p>
              {social.map((c) => (
                <a key={c.label} href={c.href} className="link-u" target="_blank" rel="noopener noreferrer">
                  {c.label}
                </a>
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className={styles.markWrap} aria-hidden="true">
        <Logo variant="wordmark" className={styles.mark} width="100%" decorative />
      </div>

      <div className={`${styles.bottom} wrap mono`}>
        <span>
          © {new Date().getFullYear()} {brand.name} ·{" "}
          <span dir="ltr">
            Made by{" "}
            <a href="https://www.instagram.com/websity.eg/" target="_blank" rel="noopener noreferrer" className={styles.credit}>
              Websity
            </a>
          </span>
        </span>
        <span>{brand.tagline || "Front: quiet. Back: loud."}</span>
        <span>Cash on delivery</span>
      </div>
    </footer>
  );
}
