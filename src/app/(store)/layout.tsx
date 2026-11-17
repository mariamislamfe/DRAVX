import { StoreShell } from "@/components/layout/StoreShell";

// catalog, prices and stock are edited live from /admin
export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
