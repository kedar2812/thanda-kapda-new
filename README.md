# Thanda Kapda Co. — website and dashboard

Marketing and catalogue site for Thanda Kapda Co., an Indian wet-wipe brand
(Morning Spring, Namasté, and custom bulk orders), plus the business
dashboard at admin.thandakapda.co that runs the business **and the website**.

## Layout

```
site/            the public website, thandakapda.co        → ./deploy.sh site
  src/             pages, components, website content model (src/content)
  public/          product photos and static files
  scripts/         content-schema check, photo resizing
  tests/e2e/       browser test of site + dashboard together
admin/           the business dashboard, admin.thandakapda.co → ./deploy.sh admin
  web/             React front end (Vite)
  api/             PHP API: index.php, src/*.php, schema.sql
  api/tests/       API tests (acceptance, website, backup)
  build.sh         builds web + api into admin/dist
deploy.sh        uploads either or both over FTPS
.deploy/         (git-ignored) FTP logins, deploy manifests, local secrets
```

The dashboard's website editor reuses the site's content model and icons
(`site/src/content`, `site/src/components/ui/Icons.tsx`), so the editor
always matches the site.

## Stack

- **Website:** Next.js 16 (App Router, static export) with React 19, Tailwind
  CSS v4, GSAP 3 (ScrollTrigger + SplitText) and Lenis. Two self-hosted fonts:
  Fraunces and Hanken Grotesk. Hosted as plain files on Apache shared hosting.
- **Dashboard:** React 19 + Vite front end (`admin/web`), PHP 8.1+ API
  (`admin/api`) and MySQL/MariaDB. Sales (with GST), stock, money, Amazon,
  GST registers, to-do list, the website editor, visitor analytics and full
  backups.

## Backups (Settings → Backup)

**Download full backup** saves one `.zip` with everything the dashboard and
the website hold: every record, every login, the activity history, visitor
statistics, every published version of the website (and the unpublished
draft), and every photo file. Keep a copy somewhere safe every month.

**Restore from a backup** puts all of it back exactly as it was. If the server
is ever lost: deploy the dashboard to the new server (`./deploy.sh all`),
create the first login when it asks, and restore the `.zip` (an empty
Overview offers it straight away). Owners only, because a backup holds every
login.

- **Nothing changes until everything has arrived.** The file is checked in the
  browser first (every table's record count and every photo's SHA-256 are in
  `manifest.json`), sent to the server in 1 MB pieces (fine on hosts with small
  upload limits; a dropped connection is retried), checked again on the
  server, then swapped in with one database transaction and one folder rename.
  If anything fails, the database rolls back and the photos stay as they were.
- **You stay signed in.** The person restoring keeps their current password
  and owner access, even if their login isn't in the backup. Everyone else is
  signed out and signs in with the password they had when the backup was made.
- **Moving to a new address works.** Photo links in the website content are
  rewritten to the server the backup is restored on.
- **Refused, with a reason, before anything changes:** a damaged or edited
  zip, a missing table or photo, a backup from a newer dashboard version,
  records with fields this dashboard doesn't store.
- Old single-file `.json` backups (from before the zip) still restore; they
  only replace the business records they contain.
- A zip that was unzipped and zipped again on a computer (one folder around
  everything) still opens.

How it works: `admin/web/src/lib/backup.ts` builds and reads the zip in the
browser (shared hosting often lacks PHP's zip extension) and
`admin/api/src/backup.php` serves the data page by page and stages, checks and
applies a restore. A new database table must be added to `BACKUP_TABLES` (or
`BACKUP_SKIPPED_TABLES`) in `backup.php`; the backup test fails until it is.

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
3. `./deploy.sh site` downloads the same file into
   `site/src/content/published.json` before building, so the HTML that search
   engines and link previews read also carries the latest words. Run it now
   and then after big edits.

Product **pages** are generated per product at build time, so adding a third
product needs a code change and a deploy; everything about the existing two is
editable.

### Where things live

| What | File |
| --- | --- |
| All website words and photos, as shipped (defaults) | `site/src/content/defaults.ts` |
| Editor layout: sections, labels, hints | `site/src/content/schema.ts` |
| Coerces any stored content to the right shape | `site/src/content/normalize.ts` |
| Baked + live content on the site, preview mode | `site/src/content/ContentProvider.tsx`, `site/src/content/index.ts` |
| Responsive image loader | `site/src/lib/image-loader.ts`, `site/scripts/photo-variants.sh` |
| Visitor counting (site side) | `site/src/lib/analytics.ts`, `site/src/components/Analytics.tsx` |
| Colours, type scale, paper textures | `site/src/app/globals.css` |
| Dashboard API: content, photos, analytics, backups, upgrades | `admin/api/src/cms.php`, `analytics.php`, `backup.php`, `migrate.php` |
| Dashboard screens | `admin/web/src/pages/Website.tsx`, `Photos.tsx`, `Analytics.tsx`, `Settings.tsx` |

To add a field: add it to `defaults.ts`, use it in the component through
`useContent()`, and give it a label in `schema.ts`. `npx jiti
scripts/check-content-schema.ts` (in `site/`) fails if any content value has
no editor field (deploy runs it too).

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

## Run it locally

```bash
(cd site && npm install && npm run dev)          # website on http://localhost:3000

# Dashboard: needs PHP 8.1+ and MySQL/MariaDB
cp admin/api/config.sample.php admin/api/config.php   # fill in the database
(cd admin/api && php -S 127.0.0.1:8081 dev-router.php)
(cd admin/web && npm install && VITE_SITE_URL=http://localhost:3000 npm run dev)   # :5174
```

For the website to read local published content and send visits to the local
API, start it with `NEXT_PUBLIC_ADMIN_URL=http://127.0.0.1:8081`.

## Testing

The API tests need scratch databases, never real data. `config.php` may name
another one through `TK_CONFIG`, e.g. a second server for the backup test:
`TK_CONFIG=/path/to/scratch-config.php php -S 127.0.0.1:8083 dev-router.php`.

```bash
cd admin/api
# Server A on an EMPTY scratch database (they create a test owner):
node tests/acceptance.mjs http://127.0.0.1:8082
node tests/website.mjs    http://127.0.0.1:8082   # content, photos, analytics
# Backup and restore, A → a second, EMPTY server B (a "new server"), plus every
# way a backup can be damaged. TK_CONFIG is A's config (the test seeds extra data):
TK_CONFIG=... npx jiti tests/backup.test.ts http://127.0.0.1:8082 http://127.0.0.1:8083

cd site
npx jiti scripts/check-content-schema.ts      # every content value is editable
node tests/e2e/run.mjs <screenshot folder>    # real browser; see the header of the file
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
- A fresh backup, downloaded and kept safe, each month (Settings → Backup)
