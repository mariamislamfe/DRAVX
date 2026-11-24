# DRAVX: streetwear storefront

"Turn your back on them." An animation-led storefront for two oversized hoodies with a quiet front and a loud back:
**Daydream** (Rex Doodle, heather grey) and **Nightshift** (Third Eye, black / electric blue).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Stack: Next.js 16 (App Router), React 19, TypeScript, GSAP 3 + ScrollTrigger, Lenis smooth scroll, Zustand (persisted cart), CSS Modules.

## Dashboard (`/admin`)

Open `http://localhost:3000/admin` (on the live site: `https://<your-domain>/admin`). Until you set the `ADMIN_PASSWORD` env variable (in `.env.local` or your host's settings), the password is `123456`. Change it before sharing the link.

| Section | What it does |
| --- | --- |
| Overview | New orders, custom orders waiting to print, revenue |
| Notifications | Every new order creates a notification. While any dashboard page is open it checks every 20 s and, on a new order, plays a chime, shows a desktop notification (after "Turn on order alerts"), adds the unread count to the tab title and refreshes the badges |
| Orders | Filter by status, search by name, phone or order number. Each order shows the customer, totals (cash on delivery), status changes with history and an internal note. Custom items get a **print sheet**: the mockup, the transparent print file (150 dpi, covering the whole print area), artwork size and position in cm, and the customer's original files. "Print order sheet" prints it. |
| Products | Create, edit, hide or delete products: price, sizes, sold-out sizes, copy, design options and photos (uploaded) |
| Categories | Add categories (e.g. Sweatpants). The shop shows a Category filter once more than one category has products. Each category has its own editable size guide (measurements × sizes, in cm), shown on its product pages |
| Customizer | The blank garments customers can design on: name, base price + per-side print price, sizes, print area (drag on the mockup), print width in cm, and colours. Each colour can have its own front/back photo of the blank; a colour without one gets the white mockup tinted |
| Homepage | The two hero products (left/right half), the order of the homepage sections and which are shown, the two "turning" hoodies and their notes, and any number of full-width **video sections** (video upload or link, optional phone video, cover image, logo, title, text, button, products shown on top, darkness, height). A hero product that's later hidden, deleted or renamed is replaced automatically, so the site never breaks |
| Site text | Every word on the storefront (menu, home, shop, product page, bag, checkout, footer, about, customizer, 404), grouped by page with search. `{placeholders}` are filled by the site; `*stars*` set words in the italic accent font. Only changed texts are stored |
| Settings | Brand name, tagline, description, website address, currency, email, phone, WhatsApp, Instagram/TikTok/Facebook, shipping and returns text, shipping fee, free-shipping threshold, customizer on/off, Meta Pixel IDs (up to 5; the store then sends PageView, AddToCart, InitiateCheckout and Purchase with the order number as event ID). Changing the currency changes the symbol only, so re-enter prices after switching |

## Customizer (`/customize`)

Customers upload images (PNG/JPG/WebP) and/or add text, then drag, resize and rotate them inside the print area on the front and/or back. They pick a colour and size, preview the result on the garment, and confirm. Only then are the files uploaded and the item added to the bag. The dashboard receives the print-ready PNG, the mockup and the originals for each printed side.

## Data & deployment

Everything the dashboard edits (catalog, categories, customizer bases, orders, settings, uploaded photos and customer designs) is stored in one of two places. It is seeded from `src/data/products.ts` on first run. Environment variables are listed in `.env.example`.

**Neon Postgres (for Vercel or any serverless host).**
1. Create a project at neon.tech (or add Neon from Vercel → Storage, which sets the variable for you).
2. Set `DATABASE_URL` (Neon → Connect) and `ADMIN_PASSWORD` in your host's environment variables.

The tables (`store` for everything the dashboard edits, `uploads` for photos and customer designs) are created automatically on the first request. The connection string is used only on the server. Writes use optimistic locking, so simultaneous orders don't overwrite each other. On Vercel a single upload is limited to about 4.5 MB, so for homepage videos paste a link to the .mp4 (or upload a short compressed clip). Videos are capped at 15 MB with Neon and 80 MB with local files.

**Local files (when `DATABASE_URL` is not set).** Data goes to `data/` (git-ignored): `store.json` + `uploads/`. Set `DATA_DIR` to put it elsewhere. Use this on a host with a persistent disk (a VPS, or Railway/Render with a volume), and back up the folder.

A new Neon database starts from the seed. Anything added locally in `data/` doesn't move over by itself.

## What's real and what's placeholder

| Area | Status |
| --- | --- |
| Product imagery | **Extracted from the reference mockups** (front, back, 4 Third Eye back designs, detail crops, transparent cut-outs). Model/lookbook photography is still pending and labelled as such. See `public/products/README.md`. New products get their photos from the dashboard. |
| Logo | From the supplied logo, as transparent PNGs in `public/brand/`, rendered as CSS masks via `components/brand/Logo.tsx`. Favicon generated from the mark. |
| Brand name, currency, contact, socials | Set in Dashboard → Settings (defaults in `src/data/schema.ts`) |
| Size chart | Set per category in Dashboard → Categories. The hoodie numbers are still sample values |
| Back-print designs | Main Design, Eyes Focus, Silhouette Energy, Minimal Symbol (from the reference sheet) |
| Customizer mockups | White and black hoodie photos in `public/customizer/`, made from the product photos with the prints removed (the black back and white back are softer, from a small source). Swap in real blank-garment photos per colour from Dashboard → Customizer |
| Cart | Fully functional, persisted to `localStorage` |
| Checkout | **Cash on delivery.** Orders are validated and priced on the server (`src/server/placeOrder.ts`) and appear in the dashboard. No card payments, and no order emails yet |
| Newsletter / "notify me" | UI only, no email provider |
| Shipping / returns copy, social links | Set in Dashboard → Settings |

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
