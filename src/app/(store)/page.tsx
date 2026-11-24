import { Hero } from "@/components/home/Hero";
import { DropGrid } from "@/components/home/DropGrid";
import { BackPrints } from "@/components/home/BackPrints";
import { TheTurn } from "@/components/home/TheTurn";
import { CustomizeTeaser } from "@/components/home/CustomizeTeaser";
import { VideoShowcase } from "@/components/home/VideoShowcase";
import { DEFAULT_HOME, type HomeSection } from "@/data/schema";
import { getCatalog } from "@/server/db";

/** Sections in the order and visibility set in Dashboard → Homepage. */
function render(s: HomeSection) {
  switch (s.type) {
    case "hero":
      return <Hero key={s.id} />;
    case "drop":
      return <DropGrid key={s.id} />;
    case "prints":
      return <BackPrints key={s.id} />;
    case "customize":
      return <CustomizeTeaser key={s.id} />;
    case "turn":
      return <TheTurn key={s.id} />;
    case "video":
      return s.video ? <VideoShowcase key={s.id} id={s.id} video={s.video} /> : null;
  }
}

export default async function HomePage() {
  const { products, settings } = await getCatalog();
  if (!products.length) {
    return (
      <section className="wrap" style={{ minHeight: "100svh", display: "grid", placeItems: "center", textAlign: "center" }}>
        <p className="display" style={{ fontSize: "var(--step-3)" }}>New drop loading.</p>
      </section>
    );
  }
  const sections = (settings.home?.sections ?? DEFAULT_HOME.sections).filter((s) => s.enabled);
  return <>{sections.map(render)}</>;
}
