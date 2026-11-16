import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/shop/ShopView";

export const metadata: Metadata = {
  title: "Shop the drop",
  description: "Oversized hoodies from two worlds: Daydream and Nightshift. Quiet on the front, loud on the back.",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100svh" }} />}>
      <ShopView />
    </Suspense>
  );
}
