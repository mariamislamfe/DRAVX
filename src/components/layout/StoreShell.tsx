import { TransitionProvider } from "@/components/transition/TransitionProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Preloader } from "@/components/layout/Preloader";
import { Header } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CatalogProvider } from "@/lib/catalog";
import { getCatalog } from "@/server/db";

/** Storefront chrome. Loads the live catalog once per request. */
export async function StoreShell({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();
  return (
    <CatalogProvider value={catalog}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <TransitionProvider>
        <SmoothScroll />
        <Preloader />
        <Header />
        <MobileMenu />
        <CartDrawer />
        <main id="main">{children}</main>
        <Footer />
      </TransitionProvider>
      <div className="grain" aria-hidden="true" />
    </CatalogProvider>
  );
}
