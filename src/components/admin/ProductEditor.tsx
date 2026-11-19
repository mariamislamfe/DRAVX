"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteProduct, saveProduct } from "@/server/admin";
import { SIZES, WORLDS, type ImageKind, type Product, type ProductColor, type ProductImage, type Size, type World } from "@/data/products";
import { slugify, type Category } from "@/data/schema";
import { UploadField } from "./UploadField";
import styles from "./Admin.module.css";

const KIND_LABEL: Record<ImageKind, string> = {
  front: "Front",
  back: "Back",
  "detail-front": "Front close-up",
  "detail-back": "Back close-up",
  model: "Model / lookbook",
  campaign: "Campaign",
};

export function ProductEditor({ initial, categories, isNew }: { initial: Product; categories: Category[]; isNew?: boolean }) {
  const router = useRouter();
  const [p, setP] = useState<Product>(initial);
  const [details, setDetails] = useState(initial.details.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const set = (patch: Partial<Product>) => {
    setSaved(false);
    setP((s) => ({ ...s, ...patch }));
  };
  const setImg = (i: number, patch: Partial<ProductImage>) => set({ images: p.images.map((im, j) => (j === i ? { ...im, ...patch } : im)) });
  const toggle = (list: Size[], s: Size) => (list.includes(s) ? list.filter((x) => x !== s) : SIZES.filter((x) => x === s || list.includes(x)));
  const variants = (p.printVariants ?? []).map((v) => ({ ...v, id: v.id || slugify(v.label) }));
  const colors = p.colors ?? [];
  const newColorId = () => `c-${Math.random().toString(36).slice(2, 8)}`;

  /** The first colour is the default the rest of the store shows. */
  const setColors = (list: ProductColor[], images = p.images) =>
    set({ colors: list.length ? list : undefined, images, ...(list[0] ? { colorName: list[0].name, colorHex: list[0].hex } : {}) });
  const setColor = (i: number, patch: Partial<ProductColor>) => setColors(colors.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const addColor = () => {
    const fresh = { id: newColorId(), name: "", hex: "#ffffff" };
    if (colors.length) return setColors([...colors, fresh]);
    // going from one colour to several: the photos so far are of the current colour
    const first = { id: newColorId(), name: p.colorName || "Colour 1", hex: p.colorHex, soldOut: p.soldOut, stock: p.stock };
    setColors([first, fresh], p.images.map((im) => ({ ...im, color: first.id })));
  };
  const removeColor = (i: number) => {
    const c = colors[i];
    const own = p.images.filter((im) => im.color === c.id).length;
    if (own && !window.confirm(`Remove “${c.name || "this colour"}” and its ${own} photo${own > 1 ? "s" : ""}?`)) return;
    const rest = colors.filter((_, j) => j !== i);
    const images = p.images.filter((im) => im.color !== c.id);
    // back to a single colour: its photos become the product's photos
    if (rest.length === 1) setColors([], images.map((im) => ({ ...im, color: undefined })));
    else setColors(rest, images);
    if (rest.length === 1) set({ colorName: rest[0].name, colorHex: rest[0].hex, soldOut: rest[0].soldOut ?? [], stock: rest[0].stock });
  };
  const moveColor = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= colors.length) return;
    const list = [...colors];
    [list[i], list[j]] = [list[j], list[i]];
    setColors(list);
  };

  const photoRows = (color: string | undefined) =>
    p.images.map((im, i) =>
      im.color !== color ? null : (
              <div key={i} className={styles.imgRow}>
                <UploadField label="Cut-out" value={im.cutout} onChange={(u) => setImg(i, { cutout: u })} />
                <UploadField label="Photo" value={im.src} onChange={(u) => setImg(i, { src: u })} />
                <div className={styles.stack}>
                  <label className={styles.field}>
                    <span>Shows</span>
                    <select value={im.kind} onChange={(e) => setImg(i, { kind: e.target.value as ImageKind })}>
                      {Object.entries(KIND_LABEL).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  {colors.length > 0 && (
                    <label className={styles.field}>
                      <span>Colour</span>
                      <select value={im.color ?? ""} onChange={(e) => setImg(i, { color: e.target.value || undefined })}>
                        <option value="">Every colour</option>
                        {colors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name || "New colour"}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {variants.length > 0 && (
                    <label className={styles.field}>
                      <span>For design option</span>
                      <select value={im.variant ?? ""} onChange={(e) => setImg(i, { variant: e.target.value || undefined })}>
                        <option value="">All</option>
                        {variants.map((v) => (
                          <option key={v.id || v.label} value={v.id}>
                            {v.label || v.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <label className={styles.field}>
                  <span>Alt text</span>
                  <textarea rows={3} value={im.alt} onChange={(e) => setImg(i, { alt: e.target.value })} placeholder="Describe the photo for screen readers" />
                </label>
                <button type="button" className={`${styles.btnDanger} ${styles.btnSm}`} onClick={() => set({ images: p.images.filter((_, j) => j !== i) })}>
                  Remove
                </button>
              </div>
            )
    );

  const save = () => {
    setError(null);
    start(async () => {
      const res = await saveProduct({ ...p, printVariants: variants, details: details.split("\n"), originalSlug: isNew ? undefined : initial.slug });
      if (!res.ok) return setError(res.error);
      setSaved(true);
      if (isNew || res.id !== initial.slug) router.replace(`/admin/products/${res.id}`);
      else router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className={styles.split}>
        <div className={styles.stack}>
          <section className={styles.card}>
            <h2>Basics</h2>
            <div className={styles.stack}>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span>Name</span>
                  <input value={p.name} onChange={(e) => set({ name: e.target.value })} required placeholder="Third Eye Sweatpants" />
                </label>
                <label className={styles.field}>
                  <span>Short name</span>
                  <input value={p.shortName} onChange={(e) => set({ shortName: e.target.value })} placeholder="Third Eye" />
                </label>
              </div>
              <label className={styles.field}>
                <span>Tagline</span>
                <input value={p.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="One line under the name" />
              </label>
              <label className={styles.field}>
                <span>Description</span>
                <textarea rows={4} value={p.description} onChange={(e) => set({ description: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Details (one per line)</span>
                <textarea
                  rows={5}
                  value={details}
                  onChange={(e) => {
                    setSaved(false);
                    setDetails(e.target.value);
                  }}
                  placeholder={"Oversized fit\nKangaroo pocket"}
                />
              </label>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span>Fit</span>
                  <textarea rows={3} value={p.fit} onChange={(e) => set({ fit: e.target.value })} />
                </label>
                <label className={styles.field}>
                  <span>Story</span>
                  <textarea rows={3} value={p.story} onChange={(e) => set({ story: e.target.value })} />
                </label>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Sizes & stock</h2>
            <div className={styles.stack}>
              <div className={styles.field}>
                <span>Offered sizes</span>
                <div className={styles.chips}>
                  {SIZES.map((s) => (
                    <label key={s} className={styles.chip}>
                      <input type="checkbox" checked={p.sizes.includes(s)} onChange={() =>
                          set({
                            sizes: toggle(p.sizes, s),
                            soldOut: p.soldOut.filter((x) => x !== s),
                            colors: p.colors?.map((c) => ({ ...c, soldOut: c.soldOut?.filter((x) => x !== s) })),
                          })
                        }
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              {colors.length === 0 ? (
                <div className={styles.field}>
                  <span>Sold out</span>
                  <div className={styles.chips}>
                    {p.sizes.map((s) => (
                      <label key={s} className={`${styles.chip} ${styles.chipOut}`}>
                        <input type="checkbox" checked={p.soldOut.includes(s)} onChange={() => set({ soldOut: toggle(p.soldOut, s) })} />
                        {s}
                      </label>
                    ))}
                  </div>
                  <small>Customers can&apos;t pick or order sold-out sizes.</small>
                </div>
              ) : (
                <div className={styles.field}>
                  <span>Sold out, per colour</span>
                  {colors.map((c, i) => (
                    <div key={c.id} className={styles.soldOutRow}>
                      <span className={styles.soldOutName}>
                        <span className={styles.swatch} style={{ background: c.hex }} />
                        {c.name || "New colour"}
                      </span>
                      <div className={styles.chips}>
                        {p.sizes.map((s) => (
                          <label key={s} className={`${styles.chip} ${styles.chipOut}`}>
                            <input type="checkbox" checked={!!c.soldOut?.includes(s)} onChange={() => setColor(i, { soldOut: toggle(c.soldOut ?? [], s) })} />
                            {s}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <small>
                    Customers can&apos;t pick a size that&apos;s sold out in the colour they chose. Set unit counts per colour in{" "}
                    <Link href="/admin/inventory" className={styles.rowLink}>
                      Inventory
                    </Link>
                    .
                  </small>
                </div>
              )}
            </div>
          </section>

          <section className={styles.card}>
            <h2>Colours</h2>
            {colors.length === 0 ? (
              <>
                <div className={styles.colorRow}>
                  <input value={p.colorName} onChange={(e) => set({ colorName: e.target.value })} placeholder="Colour name, e.g. Black" aria-label="Colour name" />
                  <input type="color" value={p.colorHex} onChange={(e) => set({ colorHex: e.target.value })} aria-label="Colour" />
                </div>
                <p className={styles.muted} style={{ margin: "4px 0 12px" }}>
                  Sell the same product in more colours, each with its own photos. Customers pick the colour on the product page.
                </p>
              </>
            ) : (
              <>
                <p className={styles.muted} style={{ marginBottom: 12 }}>
                  The first colour is the default shown in the shop. Add each colour&apos;s photos under Photos below.
                </p>
                {colors.map((c, i) => (
                  <div key={c.id} className={styles.colorRow4}>
                    <input value={c.name} onChange={(e) => setColor(i, { name: e.target.value })} placeholder="Colour name" aria-label="Colour name" required />
                    <input type="color" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })} aria-label={`${c.name || "Colour"} swatch`} />
                    <div className={styles.actions}>
                      <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => moveColor(i, -1)} disabled={i === 0} aria-label={`Move ${c.name} up`}>
                        ↑
                      </button>
                      <button
                        type="button"
                        className={`${styles.btnGhost} ${styles.btnSm}`}
                        onClick={() => moveColor(i, 1)}
                        disabled={i === colors.length - 1}
                        aria-label={`Move ${c.name} down`}
                      >
                        ↓
                      </button>
                    </div>
                    <button type="button" className={`${styles.btnDanger} ${styles.btnSm}`} onClick={() => removeColor(i)}>
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}
            <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={addColor}>
              + Add {colors.length ? "colour" : "another colour"}
            </button>
          </section>

          <section className={styles.card}>
            <h2>Design options (optional)</h2>
            <p className={styles.muted} style={{ marginBottom: 12 }}>
              Use when one product comes in several back prints. Each option can have its own back photo below.
            </p>
            {variants.map((v, i) => (
              <div key={i} className={styles.listRow}>
                <label className={styles.field}>
                  <span>Label</span>
                  <input
                    value={v.label}
                    onChange={(e) => set({ printVariants: variants.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                    placeholder="Eyes Focus"
                  />
                </label>
                <label className={styles.field}>
                  <span>ID</span>
                  <input value={v.id} onChange={(e) => set({ printVariants: variants.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)) })} placeholder="auto" />
                </label>
                <label className={styles.field}>
                  <span>Tag</span>
                  <input value={v.note} onChange={(e) => set({ printVariants: variants.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)) })} placeholder="01" />
                </label>
                <button type="button" className={`${styles.btnDanger} ${styles.btnSm}`} onClick={() => set({ printVariants: variants.filter((_, j) => j !== i) })}>
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className={`${styles.btnGhost} ${styles.btnSm}`}
              onClick={() => set({ printVariants: [...variants, { id: "", label: "", note: String(variants.length + 1).padStart(2, "0") }] })}
            >
              + Add design option
            </button>
          </section>

          <section className={styles.card}>
            <h2>Photos</h2>
            <p className={styles.muted}>
              <strong>Cut-out</strong> = transparent PNG of the garment alone (used on cards, the product stage and the home page).{" "}
              <strong>Photo</strong> = the full image with background (used for close-ups and lookbook). Upload at least a front and a back
              cut-out{colors.length > 0 ? " for each colour" : ""}.
            </p>
            {colors.length > 0 ? (
              <>
                {colors.map((c) => (
                  <div key={c.id} className={styles.colorGroup}>
                    <h3>
                      <span className={styles.swatch} style={{ background: c.hex }} />
                      {c.name || "New colour"} photos
                    </h3>
                    {photoRows(c.id)}
                    <button
                      type="button"
                      className={`${styles.btnGhost} ${styles.btnSm}`}
                      onClick={() => set({ images: [...p.images, { kind: p.images.some((im) => im.color === c.id) ? "back" : "front", alt: "", color: c.id }] })}
                    >
                      + Add {c.name || "colour"} photo
                    </button>
                  </div>
                ))}
                {p.images.some((im) => !im.color) && (
                  <div className={styles.colorGroup}>
                    <h3>Shared by every colour</h3>
                    {photoRows(undefined)}
                  </div>
                )}
              </>
            ) : (
              photoRows(undefined)
            )}
            <div style={{ marginTop: 12 }}>
              <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => set({ images: [...p.images, { kind: "detail-back", alt: "" }] })}>
                {colors.length > 0 ? "+ Add photo for every colour" : "+ Add photo"}
              </button>
            </div>
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.card}>
            <h2>Publishing</h2>
            <div className={styles.stack}>
              <label className={styles.check}>
                <input type="checkbox" checked={p.active} onChange={(e) => set({ active: e.target.checked })} />
                Live in the store
              </label>
              <label className={styles.field}>
                <span>Category</span>
                <select value={p.categoryId} onChange={(e) => set({ categoryId: e.target.value })} required>
                  <option value="" disabled>
                    Choose…
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <small>
                  <Link href="/admin/categories" className={styles.rowLink}>
                    Manage categories
                  </Link>
                </small>
              </label>
              <label className={styles.field}>
                <span>Price</span>
                <input type="number" min={0} step="0.01" value={p.price} onChange={(e) => set({ price: Number(e.target.value) })} required />
              </label>
              <label className={styles.field}>
                <span>URL</span>
                <input value={p.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="auto from name" />
                <small>/product/{p.slug || "…"}</small>
              </label>
              <label className={styles.field}>
                <span>Badge</span>
                <input value={p.badge ?? ""} onChange={(e) => set({ badge: e.target.value })} placeholder="New, Drop 02…" />
              </label>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span>Sort order</span>
                  <input type="number" value={p.rank} onChange={(e) => set({ rank: Number(e.target.value) })} />
                </label>
                <label className={styles.field}>
                  <span>Added</span>
                  <input type="date" value={p.addedAt} onChange={(e) => set({ addedAt: e.target.value })} />
                </label>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Look</h2>
            <div className={styles.stack}>
              <label className={styles.field}>
                <span>World (page styling)</span>
                <select value={p.world} onChange={(e) => set({ world: e.target.value as World })}>
                  {Object.entries(WORLDS).map(([k, w]) => (
                    <option key={k} value={k}>
                      {w.label}
                    </option>
                  ))}
                </select>
                <small>Daydream = light concrete look, Nightshift = dark blue look.</small>
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className={styles.saveBar}>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
          {!isNew && p.active && (
            <Link href={`/product/${initial.slug}`} target="_blank" className={styles.btnGhost}>
              View in store ↗
            </Link>
          )}
          {saved && <span className={styles.success}>Saved</span>}
          {error && <span className={styles.error}>{error}</span>}
        </div>
        {!isNew && (
          <button
            type="button"
            className={styles.btnDanger}
            disabled={pending}
            onClick={() => {
              if (window.confirm(`Delete “${initial.name}”? Past orders keep their copy.`)) start(() => deleteProduct(initial.slug));
            }}
          >
            Delete product
          </button>
        )}
      </div>
    </form>
  );
}
