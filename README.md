# DRAVX: streetwear storefront

"Turn your back on them." An animation-led storefront for two oversized hoodies with a quiet front and a loud back:
**Daydream** (Rex Doodle, heather grey) and **Nightshift** (Third Eye, black / electric blue).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Stack: Next.js 16 (App Router, static pages), React 19, TypeScript, GSAP 3 + ScrollTrigger, Lenis smooth scroll, Zustand (persisted cart), CSS Modules.

## What's real and what's placeholder

| Area | Status |
| --- | --- |
| Product imagery | **Extracted from the reference mockups** (front, back, 4 Third Eye back designs, detail crops, transparent cut-outs). Model/lookbook photography is still pending and labelled as such. See `public/products/README.md`. |
| Logo | From the supplied logo, as transparent PNGs in `public/brand/`, rendered as CSS masks via `components/brand/Logo.tsx`. Favicon generated from the mark. |
| Brand name, prices, currency, shipping threshold, emails | Placeholders in `src/config/brand.ts` and `src/data/products.ts` |
| Size chart | Placeholder measurements in `src/components/pdp/SizeGuide.tsx` |
| Back-print designs | Main Design, Eyes Focus, Silhouette Energy, Minimal Symbol (from the reference sheet) |
| Cart | Fully functional, persisted to `localStorage` |
| Checkout / payments | **Not connected.** `/checkout` says so explicitly. Integration point: `src/components/cart/CheckoutView.tsx` |
| Newsletter / "notify me" | UI only, no email provider |
| Shipping / returns copy, social links | To be confirmed |

## Structure

```
src/
  app/                 routes: / shop product/[slug] cart checkout about (+ sitemap, robots, 404)
  config/brand.ts      every business placeholder
  data/products.ts     catalog + image slots
  lib/                 gsap setup, cart/UI store, fly-to-bag, ready hook
  components/
    transition/        curtain page transitions (TransitionLink)
    motion/            Lenis, custom cursor, magnetic
    layout/            preloader, header, mobile menu, footer
    home/              Hero (split worlds), Worlds, TheTurn (pinned 3D flip), DropGrid,
                       Manifesto, Campaign (horizontal), MostWanted, FinalCta
    product/           HoodieRender, ProductVisual, ProductCard, NotifyTile
    pdp/               Gallery, BuyPanel, SizeGuide, Lightbox, Accordion
    cart/              drawer, line items, cart page, checkout
```

## Motion system

- **Phases:** `preloading → ready`, plus `transitioning` during page curtains. Entrance timelines wait for `ready` (`useOnReady`), so nothing animates behind a cover.
- **Easing vocabulary:** `power3/power4.out` for entrances, `power4.inOut` for curtains, `expo.out` for image reveals, `back.out` for small "pops".
- **Accessibility:** `prefers-reduced-motion` disables Lenis, the preloader, curtains, the custom cursor and pinned horizontal scroll (the campaign becomes a swipe rail). The bag drawer traps focus. The drawer, menu, size guide and zoom all close on Esc. All controls are real buttons, radios or links.
