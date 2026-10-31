# Thanda Kapda Co. — website and dashboard

Marketing and catalogue site for Thanda Kapda Co., an Indian wet-wipe brand
(Morning Spring, Namasté, and custom bulk orders), plus the business
dashboard at admin.thandakapda.co that runs the business **and the website**.

## Stack

- **Website:** Next.js 16 (App Router, static export) with React 19, Tailwind
  CSS v4, GSAP 3 (ScrollTrigger + SplitText) and Lenis. Two self-hosted fonts:
  Fraunces and Hanken Grotesk. Hosted as plain files on Apache shared hosting.
- **Dashboard:** React 19 + Vite front end (`admin/web`), PHP 8.1+ API
  (`admin/api`) and MySQL/MariaDB. Sales (with GST), stock, money, Amazon,
  GST registers, to-do list, the website editor and visitor analytics.

## Editing the website (the dashboard's Website screen)

Every word and photo on the site is edited at **admin.thandakapda.co → Website**:
40 sections across Brand & contact, Home, Products, Our story, Bulk, Contact,
FAQ and footer. A live preview of the real site sits beside the form; hover any
section in the preview and press **Edit** to jump to it.

- Changes save automatically as one shared **draft** and only reach the site
  when someone presses **Publish**. Two people editing at once are warned
  instead of overwriting each other.
- Every publish is kept in **History** and can be loaded back and republished.
- Photos are resized and compressed in the browser (640–2400 px WebP) before
  upload, so phone photos are fine. Each photo field has a focus point and
  zoom (**Crop**) so it frames well at every screen size.
- Text marked "rich" accepts `*asterisks*` for the gold/italic accent and
  line breaks.

### How published content reaches visitors

1. Publishing writes `live/content.json` on the dashboard server
   (`https://admin.thandakapda.co/live/content.json`; photos under `live/media/`).
2. Every page starts fetching that file in `<head>`, in parallel with the
   scripts. If it is newer than what the page was built with, the page
   re-renders with it straight after loading (or on the next page change if
   the visitor has already started tapping). No rebuild is needed.
3. `./deploy.sh site` downloads the same file into `src/content/published.json`
   before building, so the HTML that search engines and link previews read
   also carries the latest words. Run it now and then after big edits.

Product **pages** are generated per product at build time, so adding a third
product needs a code change and a deploy; everything about the existing two is
editable.

### Where things live

| What | File |
| --- | --- |
| All website words and photos, as shipped (defaults) | `src/content/defaults.ts` |
| Editor layout: sections, labels, hints | `src/content/schema.ts` |
| Coerces any stored content to the right shape | `src/content/normalize.ts` |
| Baked + live content on the site, preview mode | `src/content/ContentProvider.tsx`, `src/content/index.ts` |
| Responsive image loader | `src/lib/image-loader.ts`, `scripts/photo-variants.sh` |
| Visitor counting (site side) | `src/lib/analytics.ts`, `src/components/Analytics.tsx` |
| Colours, type scale, paper textures | `src/app/globals.css` |
| Dashboard API: content, photos, analytics, upgrades | `admin/api/src/cms.php`, `analytics.php`, `migrate.php` |
| Dashboard screens | `admin/web/src/pages/Website.tsx`, `Photos.tsx`, `Analytics.tsx` |

To add a field: add it to `defaults.ts`, use it in the component through
`useContent()`, and give it a label in `schema.ts`. `npx jiti
scripts/check-content-schema.ts` fails if any content value has no editor
field (deploy runs it too).

## Visitor analytics (the dashboard's Visitors screen)

Self-hosted and cookieless: no cookies, nothing stored on visitors' devices,
no IP addresses kept. A visitor is a hash of a salt that changes daily, their
IP and browser, so nobody can be followed from day to day. It records page
views, time on page, scroll depth, sources (Google, Instagram, WhatsApp,
campaigns via `utm_*`), devices, countries (from the time zone) and goals:
bulk enquiries, contact messages, WhatsApp, Amazon (per wipe), calls, emails,
Instagram and Google reviews. Bots and headless browsers are ignored. Open
`https://thandakapda.co/?tk-ignore=1` once on your own devices to leave your
visits out (`?tk-ignore=0` undoes it).

## Moving from the old dashboard (thanda-kapda.netlify.app)

The business used to run on a single-page app on Netlify that kept everything
as one JSON object in Supabase. **Settings → Move from the old dashboard**
(owners only, also offered on an empty Overview) brings it all over:

1. In the old dashboard, **⬇ Backup** (top right) downloads a `.json` file.
2. Choose it here. The server runs the whole import inside a transaction,
   works out the figures the old app showed **with its own formulas**, sets
   them beside ours, and rolls back: a preview with nothing changed.
3. **Bring it all over** downloads a backup of what's here, then replaces the
   business data (logins, website content and visitor stats stay).

How it maps (`admin/api/src/legacy.php`):

- Stock in the old app was numbers edited by hand. An "Opening stock" entry
  per design and place, dated the day before the first record, makes every
  count land exactly on the old number.
- Money recorded without an account (most of the old Excel rows) sits in an
  archived "Not specified (old dashboard)" account, zeroed by one correction,
  so balances match the old app, which left it out. Choosing the real account
  on a sale or expense moves the money there.
- Free-text people become People when they look like names; anything else is
  kept in the record's notes. Rows with no date take the date of the same
  Amazon order, or of the row next to them.
- GST sales lines the old app generated are rebuilt from their sale or order
  and keep following it. The old audit trail joins Activity with its users.
- Anything adjusted to fit (e.g. a price typed in the freight column) is
  listed under "Good to know"; nothing is dropped silently.

## Run it locally

```bash
npm install
npm run dev                       # website on http://localhost:3000

# Dashboard: needs PHP 8.1+ and MySQL/MariaDB
cp admin/api/config.sample.php admin/api/config.php   # fill in the database
(cd admin/api && php -S 127.0.0.1:8081 dev-router.php)
(cd admin/web && npm install && VITE_SITE_URL=http://localhost:3000 npm run dev)   # :5174
```

For the website to read local published content and send visits to the local
API, start it with `NEXT_PUBLIC_ADMIN_URL=http://127.0.0.1:8081`.

## Testing

```bash
# API, on an EMPTY scratch database (they create a test owner):
node admin/api/tests/acceptance.mjs http://127.0.0.1:8081
node admin/api/tests/website.mjs   http://127.0.0.1:8081   # content, photos, analytics, backups
node admin/api/tests/legacy.mjs    http://127.0.0.1:8081 old-backup.json   # import from the old dashboard (replaces data)

npx jiti scripts/check-content-schema.ts                  # every content value is editable
node tests/e2e/run.mjs <screenshot folder>                # real browser; see the header of the file
```

## Deploy

```bash
./deploy.sh all     # dashboard first (it upgrades the database), then the website
./deploy.sh site    # website only
./deploy.sh admin   # dashboard only
```

Only changed files are uploaded, assets before pages. The database upgrades
itself on the first request after a dashboard deploy (`admin/api/src/migrate.php`);
`https://admin.thandakapda.co/api/public/health` reports the schema version
and whether the `live/` folder is writable.

## Things to keep current (all in the dashboard → Website)

- Amazon ratings and prices (Products)
- Google review rating and count (Brand & contact → Google reviews)
- Pack sizes (Products)
