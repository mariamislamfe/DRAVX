import { Hero } from "@/components/home/Hero";
import { DropGrid } from "@/components/home/DropGrid";
import { BackPrints } from "@/components/home/BackPrints";
import { TheTurn } from "@/components/home/TheTurn";

export default function HomePage() {
  return (
    <>
      <Hero />
      <DropGrid />
      <BackPrints />
      <TheTurn />
    </>
  );
}
