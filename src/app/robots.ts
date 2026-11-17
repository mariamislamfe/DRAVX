import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";
import { readDB } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = (await readDB()).settings.brand.siteUrl || BRAND.url;
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/admin", "/api", "/uploads"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
