import Link from "next/link";
import { Garment } from "@/components/product/Garment";
import { StoreShell } from "@/components/layout/StoreShell";
import { getCatalog } from "@/server/db";
import { connection } from "next/server";
import { byWorld } from "@/data/products";
import { makeT } from "@/data/content";
import { Rich } from "@/components/brand/Rich";

export default async function NotFound() {
  await connection(); // live catalog, not a build-time snapshot
  const catalog = await getCatalog();
  const product = byWorld(catalog.products, "nightshift");
  const t = makeT(catalog.settings.text);
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
          {t("nf.kicker")}
        </p>
        <h1 className="display" style={{ fontSize: "var(--step-4)" }}>
          <Rich text={t("nf.title")} />
        </h1>
        <p>{t("nf.text")}</p>
        <Link href="/shop" className="btn">
          {t("nf.cta")}
        </Link>
      </div>
    </section>
    </StoreShell>
  );
}
