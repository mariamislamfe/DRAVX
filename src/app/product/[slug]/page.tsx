import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct, products, WORLDS } from "@/data/products";
import { BRAND } from "@/config/brand";
import { ProductView } from "@/components/pdp/ProductView";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
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
  const product = getProduct(slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    color: product.colorName,
    brand: { "@type": "Brand", name: BRAND.name },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: BRAND.currency,
      availability: "https://schema.org/InStock",
      url: `${BRAND.url}/product/${product.slug}`,
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
