import Link from "next/link";
import { Garment } from "@/components/product/Garment";
import { StoreShell } from "@/components/layout/StoreShell";
import { getCatalog } from "@/server/db";
import { connection } from "next/server";
import { byWorld } from "@/data/products";

export default async function NotFound() {
  await connection(); // live catalog, not a build-time snapshot
  const product = byWorld((await getCatalog()).products, "nightshift");
  return (
    <StoreShell>
    <section
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "calc(var(--header-h) + 40px) var(--gutter) 60px",
        gap: 24,
      }}
    >
      <div style={{ display: "grid", gap: 20, justifyItems: "center" }}>
        <div style={{ width: "min(260px, 60vw)", transform: "rotate(-8deg)" }} aria-hidden="true">
          {product && <Garment product={product} view="back" variant={product.printVariants?.at(-1)?.id} decorative sizes="260px" />}
        </div>
        <p className="mono" style={{ color: "var(--blue-hi)" }}>
          Error 404
        </p>
        <h1 className="display" style={{ fontSize: "var(--step-4)" }}>
          Wrong <em className="serif">turn.</em>
        </h1>
        <p>This page turned its back on you. Fair enough.</p>
        <Link href="/shop" className="btn">
          Back to the drop →
        </Link>
      </div>
    </section>
    </StoreShell>
  );
}
