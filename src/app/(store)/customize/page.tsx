import type { Metadata } from "next";
import { Customizer } from "@/components/customize/Customizer";

export const metadata: Metadata = {
  title: "Customize",
  description: "Put your own artwork on our oversized hoodie. Upload, place it, preview it on the garment, then order.",
};

export default function CustomizePage() {
  return <Customizer />;
}
