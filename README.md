# Thanda Kapda Co. — website

Marketing and catalogue site for Thanda Kapda Co., an Indian wet-wipe brand
(Morning Spring, Namasté, and custom bulk orders).

## Stack

- **Next.js 16** (App Router, Turbopack) with **React 19** and TypeScript
- **Tailwind CSS v4** with the brand tokens defined in `src/app/globals.css`
- **GSAP 3.15** (ScrollTrigger + SplitText) for scroll-driven reveals, the pinned
  ingredients track and the hero entrance
- **Lenis** for smooth wheel scrolling (native touch scrolling is kept on phones;
  visitors with reduced-motion get plain scrolling and no animation)
- **next/font** self-hosting two families only: Fraunces (display serif) and
  Hanken Grotesk (text)

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

Deploys anywhere Next.js runs (Vercel is zero-config).

## Where things live

| What                                   | File                                          |
| -------------------------------------- | --------------------------------------------- |
| Products, prices, ingredients, images  | `src/data/products.ts`                        |
| Contact details, nav, ticker claims    | `src/data/site.ts`                            |
| FAQ copy                               | `src/data/faq.ts`                             |
| Colours, type scale, paper textures    | `src/app/globals.css`                         |
| Home page sections                     | `src/components/home/*`                       |
| Shared UI (buttons, stamps, torn edges)| `src/components/ui/*`                         |
| Scroll/text animation primitives       | `src/components/motion/*`                     |
| Product photos                         | `public/products/*`                           |

## Swapping in final photography

Product images currently come from the Amazon listings. To replace them, drop
new files into `public/products/` and update the `packshot`, `hero` and
`gallery` entries in `src/data/products.ts` (keep `width`/`height` accurate so
there is no layout shift). The hero polaroids use `packshot`; the collection
cards and product pages use `hero` and `gallery`.

## Forms

The bulk-order and contact forms have no backend. They compose a message and
open WhatsApp (`site.whatsapp`) with an email fallback (`site.email`). Swap in a
form service or API route if you would rather collect submissions.

## Things to keep current

- Amazon rating counts in `src/data/products.ts` (`rating.count`)
- Prices and MRP in the same file
- Pack sizes listed under `sizes`
