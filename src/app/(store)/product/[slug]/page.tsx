import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WORLDS } from "@/data/products";
import { getCatalog } from "@/server/db";
import { ProductView } from "@/components/pdp/ProductView";

async function getProduct(slug: string) {
  return (await getCatalog()).products.find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${WORLDS[p.world].label}`,
    description: `${p.tagline} ${p.description}`,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: p.tagline, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, settings } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  const brand = settings.brand;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    color: product.colorName,
    brand: { "@type": "Brand", name: brand.name },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: brand.currency,
      availability: product.soldOut.length >= product.sizes.length ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `${brand.siteUrl}/product/${product.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={<div style={{ minHeight: "100svh" }} />}>
        <ProductView slug={product.slug} />
      </Suspense>
    </>
  );
}
