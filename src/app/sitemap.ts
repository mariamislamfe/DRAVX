import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";
import { getCatalog } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = BRAND.url;
  const { products, templates } = await getCatalog();
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/shop`, priority: 0.9 },
    { url: `${base}/about`, priority: 0.6 },
    ...(templates.length ? [{ url: `${base}/customize`, priority: 0.7 }] : []),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, priority: 0.8 })),
  ];
}
