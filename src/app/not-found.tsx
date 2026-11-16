import Link from "next/link";
import { Garment } from "@/components/product/Garment";
import { getProduct } from "@/data/products";

export default function NotFound() {
  return (
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
          <Garment product={getProduct("third-eye-hoodie")!} view="back" variant="minimal-symbol" decorative sizes="260px" />
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
  );
}
