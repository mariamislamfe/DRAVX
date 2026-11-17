import { Hero } from "@/components/home/Hero";
import { DropGrid } from "@/components/home/DropGrid";
import { BackPrints } from "@/components/home/BackPrints";
import { TheTurn } from "@/components/home/TheTurn";
import { CustomizeTeaser } from "@/components/home/CustomizeTeaser";

import { getCatalog } from "@/server/db";

export default async function HomePage() {
  const { products } = await getCatalog();
  if (!products.length) {
    return (
      <section className="wrap" style={{ minHeight: "100svh", display: "grid", placeItems: "center", textAlign: "center" }}>
        <p className="display" style={{ fontSize: "var(--step-3)" }}>New drop loading.</p>
      </section>
    );
  }
  return (
    <>
      <Hero />
      <DropGrid />
      <BackPrints />
      <CustomizeTeaser />
      <TheTurn />
    </>
  );
}
