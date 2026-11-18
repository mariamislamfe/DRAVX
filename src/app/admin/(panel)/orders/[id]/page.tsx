import Link from "next/link";
import { notFound } from "next/navigation";
import { readDB } from "@/server/db";
import { deleteOrder, updateOrder } from "@/server/admin";
import { formatPrice } from "@/config/brand";
import { ORDER_STATUSES, PAYMENT_LABEL, STATUS_LABEL, type CustomDesign, type OrderItem } from "@/data/schema";
import { StatusPill, fmtDate } from "@/components/admin/bits";
import { ConfirmButton, PrintButton } from "@/components/admin/ClientBits";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Order" };

const SIDE = { front: "Front", back: "Back" } as const;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  const o = db.orders.find((x) => x.id === id);
  if (!o) notFound();
  const save = updateOrder.bind(null, o.id);
  const remove = deleteOrder.bind(null, o.id);

  return (
    <>
      <header className={styles.head}>
        <div>
          <Link href="/admin/orders" className={`${styles.crumb} ${styles.noPrint} mono`}>
            ← Orders
          </Link>
          <h1>{o.number}</h1>
          <p>
            {fmtDate(o.createdAt)} · <StatusPill status={o.status} />
          </p>
        </div>
        <div className={`${styles.actions} ${styles.noPrint}`}>
          <PrintButton />
        </div>
      </header>

      <div className={styles.split}>
        <div className={styles.stack}>
          <section className={styles.card}>
            <h2>Items</h2>
            {o.items.map((it, i) => (
              <ItemRow key={i} item={it} />
            ))}
          </section>

          {o.items
            .filter((it): it is OrderItem & { custom: CustomDesign } => !!it.custom)
            .map((it, i) => (
              <CustomSheet key={i} item={it} index={i} />
            ))}
        </div>

        <div className={styles.stack}>
          <section className={styles.card}>
            <h2>Customer</h2>
            <dl className={styles.kv}>
              <dt>Name</dt>
              <dd>{o.customer.name}</dd>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${o.customer.phone.replace(/[^\d+]/g, "")}`} className={styles.rowLink}>
                  {o.customer.phone}
                </a>
              </dd>
              {o.customer.email && (
                <>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${o.customer.email}`}>{o.customer.email}</a>
                  </dd>
                </>
              )}
              <dt>City</dt>
              <dd>{o.customer.city}</dd>
              <dt>Address</dt>
              <dd style={{ whiteSpace: "pre-line" }}>{o.customer.address}</dd>
              {o.customer.notes && (
                <>
                  <dt>Notes</dt>
                  <dd style={{ whiteSpace: "pre-line" }}>{o.customer.notes}</dd>
                </>
              )}
            </dl>
          </section>

          <section className={styles.card}>
            <h2>Totals</h2>
            <dl className={styles.kv}>
              <dt>Subtotal</dt>
              <dd className={styles.num}>{formatPrice(o.subtotal)}</dd>
              {o.discount && (
                <>
                  <dt>Discount · {o.discount.code}</dt>
                  <dd className={styles.num}>{o.discount.amount ? `−${formatPrice(o.discount.amount)}` : "Free shipping"}</dd>
                </>
              )}
              <dt>Shipping</dt>
              <dd className={styles.num}>{o.shipping ? formatPrice(o.shipping) : "Free"}</dd>
              <dt>Payment</dt>
              <dd className={styles.num}>{PAYMENT_LABEL[o.payment ?? "cod"]}</dd>
              <dt>
                <strong>{(o.payment ?? "cod") === "cod" ? "Collect on delivery" : "Total (check the transfer)"}</strong>
              </dt>
              <dd className={styles.num}>
                <strong>{formatPrice(o.total)}</strong>
              </dd>
            </dl>
          </section>

          <section className={`${styles.card} ${styles.noPrint}`}>
            <h2>Update</h2>
            <form action={save} className={styles.stack}>
              <label className={styles.field}>
                <span>Status</span>
                <select name="status" defaultValue={o.status}>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Internal note</span>
                <textarea name="adminNote" rows={3} defaultValue={o.adminNote} placeholder="Only visible here" />
              </label>
              <button type="submit" className={styles.btn}>
                Save
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <h2>History</h2>
            <ol className={styles.timeline}>
              {[...o.history].reverse().map((h, i) => (
                <li key={i}>
                  <StatusPill status={h.status} />
                  <span className={styles.muted}>{fmtDate(h.at)}</span>
                </li>
              ))}
            </ol>
          </section>

          <form action={remove} className={styles.noPrint}>
            <ConfirmButton className={styles.btnDanger} message={`Delete order ${o.number}? This can't be undone.`}>
              Delete order
            </ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}

function ItemRow({ item: it }: { item: OrderItem }) {
  return (
    <div className={styles.item}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {it.image ? <img src={it.image} alt="" /> : <span />}
      <div>
        <strong>
          {it.slug ? (
            <Link href={`/admin/products/${it.slug}`} className={styles.rowLink}>
              {it.name}
            </Link>
          ) : (
            it.name
          )}
        </strong>
        <div className={styles.muted}>
          {[it.colorName, `Size ${it.size}`, it.variantLabel, it.custom ? it.custom.sides.map((s) => SIDE[s.side]).join(" + ") + " print" : null]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      <div className={styles.num}>
        {it.qty} × {formatPrice(it.unitPrice)}
        <br />
        <strong>{formatPrice(it.qty * it.unitPrice)}</strong>
      </div>
    </div>
  );
}

/** Everything the print shop needs for one custom item. */
function CustomSheet({ item: it, index }: { item: OrderItem & { custom: CustomDesign }; index: number }) {
  const c = it.custom;
  return (
    <section className={styles.card}>
      <h2>
        Print sheet {index + 1} · {c.templateName}
      </h2>
      <dl className={styles.kv} style={{ marginBottom: 16 }}>
        <dt>Garment</dt>
        <dd>
          <span className={styles.swatch} style={{ background: c.colorHex }} />
          {c.colorName} ({c.colorHex}) · Size {it.size} · Qty {it.qty}
        </dd>
        {c.note && (
          <>
            <dt>Customer note</dt>
            <dd style={{ whiteSpace: "pre-line" }}>{c.note}</dd>
          </>
        )}
      </dl>

      <div className={styles.stack}>
        {c.sides.map((s) => (
          <div key={s.side} className={styles.customBlock}>
            <strong className="mono">{SIDE[s.side]} print</strong>
            <div className={styles.printSide}>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.mockupUrl} alt={`${SIDE[s.side]} mockup`} />
                <figcaption className={styles.muted}>
                  On the garment ·{" "}
                  <a href={`${s.mockupUrl}?download`} className={`${styles.rowLink} ${styles.noPrint}`}>
                    Download
                  </a>
                </figcaption>
              </figure>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.designUrl} alt={`${SIDE[s.side]} print file`} style={{ background: c.colorHex, padding: 12 }} />
                <figcaption className={styles.muted}>
                  Print file (transparent PNG, {s.dpi} dpi, previewed on {c.colorName.toLowerCase()}) ·{" "}
                  <a href={`${s.designUrl}?download`} className={`${styles.rowLink} ${styles.noPrint}`}>
                    Download
                  </a>
                </figcaption>
              </figure>
            </div>
            <table className={styles.specs}>
              <tbody>
                <tr>
                  <td>Print file covers</td>
                  <td>
                    {s.areaWidthCm} × {s.areaHeightCm} cm (full print area)
                  </td>
                </tr>
                <tr>
                  <td>Actual artwork size</td>
                  <td>
                    <strong>
                      {s.artWidthCm} × {s.artHeightCm} cm
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td>Artwork position</td>
                  <td>
                    {s.artTopCm} cm from top of area · {s.artLeftCm} cm from left
                    {Math.abs(s.artLeftCm + s.artWidthCm / 2 - s.areaWidthCm / 2) < 0.3 ? " (centred)" : ""}
                  </td>
                </tr>
                <tr>
                  <td>Layers</td>
                  <td>{s.layers.map((l) => l.label).join(" · ") || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {c.originals.length > 0 && (
          <div className={styles.noPrint}>
            <p className={styles.label} style={{ marginBottom: 8 }}>
              Original uploads (full quality, as the customer sent them)
            </p>
            <div className={styles.actions}>
              {c.originals.map((u, i) => (
                <a key={u} href={`${u}?download`} className={`${styles.btnGhost} ${styles.btnSm}`}>
                  Original {i + 1} ↓
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
