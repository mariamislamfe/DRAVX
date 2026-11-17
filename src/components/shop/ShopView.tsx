"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { gsap, ScrollTrigger, splitChars } from "@/lib/gsap";
import { useOnReady } from "@/lib/useReady";
import { type World } from "@/data/products";
import { useCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import styles from "./Shop.module.css";

type Filter = "all" | World;
type Sort = "featured" | "price-asc" | "price-desc" | "newest";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "daydream", label: "Daydream" },
  { id: "nightshift", label: "Nightshift" },
];
const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low → high" },
  { id: "price-desc", label: "Price: high → low" },
];

export function ShopView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});
  const grid = useRef<HTMLDivElement>(null);
  const { products: all, categories } = useCatalog();
  const cats = categories.filter((c) => all.some((p) => p.categoryId === c.id));
  const cat = cats.some((c) => c.id === params.get("cat")) ? params.get("cat")! : "all";
  const products = cat === "all" ? all : all.filter((p) => p.categoryId === cat);

  const filter = (FILTERS.some((f) => f.id === params.get("world")) ? params.get("world") : "all") as Filter;
  const sort = (SORTS.some((s) => s.id === params.get("sort")) ? params.get("sort") : "featured") as Sort;

  const list = useMemo(() => {
    const l = products.filter((p) => filter === "all" || p.world === filter);
    return [...l].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "newest") return b.addedAt.localeCompare(a.addedAt);
      return a.rank - b.rank;
    });
  }, [filter, sort, products]);

  const update = (next: Partial<{ world: Filter; sort: Sort; cat: string }>) => {
    const sp = new URLSearchParams(params.toString());
    const w = next.world ?? filter;
    const s = next.sort ?? sort;
    const c = next.cat ?? cat;
    if (c === "all") sp.delete("cat");
    else sp.set("cat", c);
    if (w === "all") sp.delete("world");
    else sp.set("world", w);
    if (s === "featured") sp.delete("sort");
    else sp.set("sort", s);
    const q = sp.toString();
    router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
  };

  // sliding tab indicator
  useLayoutEffect(() => {
    const t = tabs.current[filter];
    if (!t || !indicator.current) return;
    gsap.to(indicator.current, { x: t.offsetLeft, width: t.offsetWidth, duration: 0.6, ease: "power3.out" });
  }, [filter]);

  // tone of the page follows the selected world
  useEffect(() => {
    root.current!.dataset.tone = filter;
  }, [filter]);

  // re-animate grid when results change
  useLayoutEffect(() => {
    const cells = grid.current?.querySelectorAll("[data-cell]");
    if (!cells?.length) return;
    gsap.fromTo(cells, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.9, ease: "power4.out", onComplete: () => ScrollTrigger.refresh() });
  }, [list]);

  // page entrance
  const intro = useRef<gsap.core.Timeline | null>(null);
  useLayoutEffect(() => {
    const title = root.current!.querySelector<HTMLElement>(`.${styles.title}`)!;
    const chars = splitChars(title);
    intro.current = gsap
      .timeline({ paused: true })
      .from(chars, { yPercent: 110, rotate: 6, stagger: 0.035, duration: 1, ease: "power4.out" })
      .from(root.current!.querySelectorAll("[data-intro]"), { y: 20, autoAlpha: 0, stagger: 0.07, duration: 0.7 }, "-=0.6");
    return () => {
      intro.current?.revert();
    };
  }, []);
  useOnReady(() => intro.current?.play());


  return (
    <div ref={root} className={styles.page} data-tone={filter}>
      <header className={`${styles.head} wrap`}>
        <h1 className={`${styles.title} display`}>The drop</h1>
        <span className={`${styles.count} display`} data-intro>
          ({String(list.length).padStart(2, "0")})
        </span>
      </header>

      <div className={`${styles.controls} wrap`} data-intro>
        <div className={styles.tabs} role="tablist" aria-label="Filter by world">
          <span ref={indicator} className={styles.indicator} aria-hidden="true" />
          {FILTERS.map((f) => (
            <button
              key={f.id}
              ref={(el) => {
                tabs.current[f.id] = el;
              }}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`${styles.tab} mono`}
              onClick={() => update({ world: f.id })}
            >
              {f.label}
              <sup>{f.id === "all" ? products.length : products.filter((p) => p.world === f.id).length}</sup>
            </button>
          ))}
        </div>
        {cats.length > 1 && (
          <label className={`${styles.sort} mono`}>
            <span>Category</span>
            <select value={cat} onChange={(e) => update({ cat: e.target.value })}>
              <option value="all">All</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={`${styles.sort} mono`}>
          <span>Sort</span>
          <select value={sort} onChange={(e) => update({ sort: e.target.value as Sort })}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div ref={grid} className={`${styles.grid} wrap`} aria-live="polite">
        {list.length === 0 ? (
          <div className={styles.empty} data-cell>
            <p className="display">Nothing here yet.</p>
            <button type="button" className="btn" onClick={() => update({ world: "all", cat: "all" })}>
              Show everything
            </button>
          </div>
        ) : (
          list.map((p, i) => (
            <div key={p.slug} data-cell className={styles.cell}>
              <ProductCard product={p} index={i} priority={i < 2} />
            </div>
          ))
        )}
      </div>

    </div>
  );
}
