"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useCart, useUI } from "@/lib/store";
import { flyToCart } from "@/lib/fly";
import { formatPrice } from "@/config/brand";
import { useCatalog } from "@/lib/catalog";
import { WORLDS, type Product, type Size } from "@/data/products";
import { TransitionLink } from "@/components/transition/TransitionLink";
import Image from "next/image";
import { getColor, getImage, productColors } from "@/data/products";
import { QtyStepper } from "@/components/cart/QtyStepper";
import { SizeGuide } from "./SizeGuide";
import { Accordion } from "./Accordion";
import styles from "./Pdp.module.css";

type Status = "idle" | "error" | "adding" | "added";

type Props = {
  product: Product;
  variant?: string;
  onVariant: (id: string) => void;
  color?: string;
  onColor: (id: string) => void;
};

export function BuyPanel({ product, variant, onVariant, color, onColor }: Props) {
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [guide, setGuide] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const add = useCart((s) => s.add);
  const { settings, categories } = useCatalog();
  const { freeShippingThreshold: freeOver, shippingFee, brand } = settings;
  const sizeChart = categories.find((c) => c.id === product.categoryId)?.sizeChart;
  const setCartOpen = useUI((s) => s.setCartOpen);
  const sizesRef = useRef<HTMLDivElement>(null);
  const hiRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const world = WORLDS[product.world];
  const variantObj = product.printVariants?.find((v) => v.id === variant);
  const colors = productColors(product);
  const colorObj = getColor(product, color);

  // sliding highlight behind the selected size
  useLayoutEffect(() => {
    const hi = hiRef.current;
    const wrap = sizesRef.current;
    if (!hi || !wrap) return;
    const btn = size ? wrap.querySelector<HTMLElement>(`[data-size="${size}"]`) : null;
    if (!btn) {
      gsap.set(hi, { autoAlpha: 0 });
      return;
    }
    const first = hi.style.visibility !== "inherit";
    gsap[first ? "set" : "to"](hi, {
      autoAlpha: 1,
      x: btn.offsetLeft,
      y: btn.offsetTop,
      width: btn.offsetWidth,
      height: btn.offsetHeight,
      ...(first ? {} : { duration: 0.55, ease: "power3.out" }),
    });
    if (first) gsap.from(hi, { scale: 0.4, duration: 0.5, ease: "back.out(2)" });
  }, [size]);

  // confirmation reveal
  useLayoutEffect(() => {
    if (status === "added" && confirmRef.current) {
      gsap.fromTo(confirmRef.current, { height: 0, autoAlpha: 0 }, { height: "auto", autoAlpha: 1, duration: 0.6, ease: "power3.out" });
    }
  }, [status]);

  // mobile sticky bar appears once the main button scrolls away
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const io = new IntersectionObserver(([e]) => setBarVisible(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(btn);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const submit = (origin?: HTMLElement | null) => {
    if (status === "adding") return;
    if (!size) {
      setStatus("error");
      sizesRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      gsap.fromTo(sizesRef.current, { x: 0 }, { keyframes: { x: [-10, 10, -7, 7, -3, 0] }, duration: 0.5, ease: "none" });
      return;
    }
    setStatus("adding");
    timer.current = window.setTimeout(() => {
      add({ slug: product.slug, size, variant, color: product.colors?.length ? colorObj.id : undefined }, qty);
      flyToCart(origin ?? btnRef.current, product.world === "daydream" ? "#ff5b1f" : "#2d6bff");
      setStatus("added");
      timer.current = window.setTimeout(() => setStatus("idle"), 4200);
    }, 420);
  };

  const label =
    status === "adding" ? "Adding…" : status === "added" ? "Added to bag ✓" : size ? `Add to bag — ${formatPrice(product.price * qty)}` : "Select a size";

  return (
    <aside className={styles.buy} aria-label="Purchase options">
      <div className={styles.buyInner}>
        <nav className={`${styles.crumbs} mono`} aria-label="Breadcrumb" data-buy>
          <TransitionLink href="/shop" className="link-u">
            Shop
          </TransitionLink>
          <span aria-hidden="true">/</span>
          <TransitionLink href={`/shop?world=${product.world}`} className="link-u">
            {world.label}
          </TransitionLink>
        </nav>

        <div className={styles.tags} data-buy>
          <span className={`tag ${product.world === "nightshift" ? "tag--blue" : ""}`}>
            {world.index} — {world.label}
          </span>
          {product.badge && <span className="tag tag--outline">{product.badge}</span>}
        </div>

        <h1 className={`${styles.name} display`} data-title>
          {product.name}
        </h1>
        <div className={styles.priceRow} data-buy>
          <p className={`${styles.price} display`}>{formatPrice(product.price)}</p>
          <p className={`${styles.priceNote} mono`}>Shipping at checkout · cash on delivery</p>
        </div>
        <p className={styles.tagline} data-buy>
          {product.tagline}
        </p>

        {colors.length > 1 ? (
          <fieldset className={styles.option} data-buy>
            <legend className={`${styles.optLabel} mono`}>
              Colour <span>{colorObj.name}</span>
            </legend>
            <div className={styles.swatches}>
              {colors.map((c) => (
                <label key={c.id} className={styles.swatchPick} data-on={c.id === colorObj.id || undefined} title={c.name}>
                  <input type="radio" name="color" value={c.id} checked={c.id === colorObj.id} onChange={() => onColor(c.id)} className="sr-only" />
                  <span className={styles.swatch} style={{ background: c.hex }} aria-hidden="true" />
                  <span className="sr-only">{c.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <div className={styles.option} data-buy>
            <p className={`${styles.optLabel} mono`}>
              Colour <span>{colorObj.name}</span>
            </p>
            <span className={styles.swatch} style={{ background: colorObj.hex }} aria-label={`${colorObj.name} (only colour)`} role="img" />
          </div>
        )}

        {product.printVariants && (
          <fieldset className={styles.option} data-buy>
            <legend className={`${styles.optLabel} mono`}>
              Back print <span>{variantObj?.label}</span>
            </legend>
            <div className={styles.variants}>
              {product.printVariants.map((v) => (
                <label key={v.id} className={styles.variant} data-on={variant === v.id || undefined}>
                  <input type="radio" name="print" value={v.id} checked={variant === v.id} onChange={() => onVariant(v.id)} className="sr-only" />
                  <span className={styles.variantArt} aria-hidden="true">
                    {(() => {
                      const art = getImage(product, "back", v.id, color);
                      const src = art.variant === v.id ? art.src ?? art.cutout : undefined;
                      return src ? (
                        <Image src={src} alt="" fill sizes="120px" style={{ objectFit: "cover", objectPosition: "50% 45%", transform: "scale(1.55)" }} />
                      ) : (
                        <span className="display" style={{ display: "grid", placeItems: "center", height: "100%" }}>{v.note}</span>
                      );
                    })()}
                  </span>
                  <span className="mono">{v.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className={styles.option} data-buy>
          <div className={styles.optHead}>
            <legend className={`${styles.optLabel} mono`}>
              Size <span>{size ?? "—"}</span>
            </legend>
            {sizeChart && (
              <button type="button" className="mono link-u" onClick={() => setGuide(true)}>
                Size guide
              </button>
            )}
          </div>
          <div ref={sizesRef} className={styles.sizes} data-error={status === "error" || undefined}>
            <span ref={hiRef} className={styles.sizeHi} aria-hidden="true" />
            {product.sizes.map((s) => {
              const out = product.soldOut.includes(s);
              return (
                <label key={s} className={styles.size} data-size={s} data-out={out || undefined} data-on={size === s || undefined}>
                  <input
                    type="radio"
                    name="size"
                    value={s}
                    disabled={out}
                    checked={size === s}
                    onChange={() => {
                      setSize(s);
                      if (status === "error") setStatus("idle");
                    }}
                    className="sr-only"
                  />
                  <span className="mono">{s}</span>
                  {out && <span className="sr-only">sold out</span>}
                </label>
              );
            })}
          </div>
          <p className={`${styles.sizeMsg} mono`} role="status" aria-live="polite">
            {status === "error" ? "↑ Pick a size first" : product.soldOut.length ? `${product.soldOut.join(", ")} sold out` : " "}
          </p>
        </fieldset>

        <div className={styles.addRow} data-buy>
          <QtyStepper value={qty} onChange={setQty} />
          <button
            ref={btnRef}
            type="button"
            className={`btn btn--ink ${styles.addBtn}`}
            data-status={status}
            onClick={(e) => submit(e.currentTarget)}
            aria-live="polite"
          >
            <span key={label} className={styles.addLabel}>
              {label}
            </span>
          </button>
        </div>

        {status === "added" && (
          <div ref={confirmRef} className={styles.confirm} role="status">
            <p className="mono">
              {product.shortName} · {colors.length > 1 ? `${colorObj.name} · ` : ""}{size} {variantObj ? `· ${variantObj.label} ` : ""}× {qty} is in your bag.
            </p>
            <div className={styles.confirmLinks}>
              <button type="button" className="mono link-u" onClick={() => setCartOpen(true)}>
                View bag
              </button>
              <TransitionLink href="/checkout" className="mono link-u">
                Checkout →
              </TransitionLink>
            </div>
          </div>
        )}

        <p className={`${styles.perk} mono`} data-buy>
          ✳ Free shipping over {formatPrice(freeOver)}
        </p>

        <div data-buy>
          <Accordion
            items={[
              { id: "desc", title: "Description", content: <p>{product.description}</p>, open: true },
              {
                id: "details",
                title: "Details",
                content: (
                  <ul className={styles.detailList}>
                    {product.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                ),
              },
              { id: "fit", title: "Fit", content: <p>{product.fit}</p> },
              ...(brand.shippingInfo || brand.returnsInfo || shippingFee
                ? [
                    {
                      id: "ship",
                      title: brand.returnsInfo ? "Shipping & returns" : "Shipping",
                      content: (
                        <div className={styles.policy}>
                          <p>
                            {shippingFee ? `Shipping ${formatPrice(shippingFee)}` : "Free shipping"}
                            {shippingFee && freeOver ? `, free over ${formatPrice(freeOver)}` : ""}. Cash on delivery.
                          </p>
                          {brand.shippingInfo && <p>{brand.shippingInfo}</p>}
                          {brand.returnsInfo && <p>{brand.returnsInfo}</p>}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      {/* mobile sticky purchase bar */}
      <div className={styles.bar} data-visible={barVisible || undefined} aria-hidden={!barVisible} inert={!barVisible}>
        <div>
          <p className={`${styles.barName} display`}>{product.shortName}</p>
          <p className="mono">
            {formatPrice(product.price)} {size ? `· ${size}` : ""}
          </p>
        </div>
        <button type="button" className="btn" onClick={(e) => submit(e.currentTarget)}>
          {status === "added" ? "Added ✓" : size ? "Add to bag" : "Pick size"}
        </button>
      </div>

      {sizeChart && <SizeGuide chart={sizeChart} open={guide} onClose={() => setGuide(false)} />}
    </aside>
  );
}
