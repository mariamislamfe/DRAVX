import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Archivo, Instrument_Serif, JetBrains_Mono, Permanent_Marker } from "next/font/google";
import { BRAND } from "@/config/brand";
import { TransitionProvider } from "@/components/transition/TransitionProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Preloader } from "@/components/layout/Preloader";
import { Header } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import "./globals.css";

const display = Big_Shoulders({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--f-display", display: "swap" });
const body = Archivo({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-body", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["italic"], variable: "--f-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono", display: "swap" });
const hand = Permanent_Marker({ subsets: ["latin"], weight: "400", variable: "--f-hand", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: { default: `${BRAND.name} — Turn your back on them`, template: `%s — ${BRAND.name}` },
  description: BRAND.description,
  openGraph: { type: "website", siteName: BRAND.name, title: `${BRAND.name} — Turn your back on them`, description: BRAND.description },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${serif.variable} ${mono.variable} ${hand.variable}`}>
      <body>
        <noscript>
          <style>{`[data-preloader]{display:none!important}`}</style>
        </noscript>
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
      </body>
    </html>
  );
}
