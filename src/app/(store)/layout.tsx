import type { Metadata } from "next";
import { StoreShell } from "@/components/layout/StoreShell";
import { readDB } from "@/server/db";

// catalog, prices and stock are edited live from /admin
export const dynamic = "force-dynamic";

/** Site title, description and base URL come from Dashboard → Settings → Brand. */
export async function generateMetadata(): Promise<Metadata> {
  const b = (await readDB()).settings.brand;
  const title = b.tagline ? `${b.name}: ${b.tagline.replace(/\.$/, "")}` : b.name;
  let base: URL | undefined;
  try {
    base = new URL(b.siteUrl);
  } catch {}
  return {
    metadataBase: base,
    title: { default: title, template: `%s | ${b.name}` },
    description: b.description,
    openGraph: { type: "website", siteName: b.name, title, description: b.description },
  };
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
