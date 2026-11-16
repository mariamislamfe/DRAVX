import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";
import { products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = BRAND.url;
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/shop`, priority: 0.9 },
    { url: `${base}/about`, priority: 0.6 },
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, priority: 0.8 })),
  ];
}
