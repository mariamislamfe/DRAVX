import type { Metadata } from "next";
import { AboutView } from "@/components/about/AboutView";

export const metadata: Metadata = {
  title: "Manifesto",
  description: "Front: quiet. Back: loud. Why DRAVX puts everything on the back of the hood.",
};

export default function AboutPage() {
  return <AboutView />;
}
