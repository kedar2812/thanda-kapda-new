// End-to-end: website + dashboard + CMS + analytics in a real browser.
// Needs, all local (see README, Testing):
//   API on :8081 (admin/api, php -S ... dev-router.php) on a database with the acceptance-test owner,
//   the site built with NEXT_PUBLIC_ADMIN_URL=http://127.0.0.1:8081 and served by tests/e2e/serve-site.mjs on :3000,
//   the dashboard dev server with VITE_SITE_URL=http://localhost:3000 on :5174.
//   node tests/e2e/run.mjs <folder for screenshots>
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const SITE = 'http://127.0.0.1:3000'
const ADMIN = 'http://localhost:5174'
const OUT = process.argv[2]
let failures = 0
const check = (name, ok, extra = '') => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${extra}`}`)
}

const browser = await chromium.launch()
const errors = []
const watch = (page, tag) => {
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${tag}] ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`[${tag}] pageerror ${e.message}`))
}

// ---------------------------------------------------------------- site, before any publish
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA })
const site = await ctx.newPage()
watch(site, 'site')
const pings = []
site.on('request', (r) => r.url().includes('/api/public/ping') && pings.push(r.postData()))
await site.goto(SITE + '/', { waitUntil: 'networkidle' })
await site.waitForTimeout(2500)
const h1 = await site.locator('h1#hero-title').innerText()
check('Home renders the built-in headline', /warm\s+country/i.test(h1), h1)
check('World map land file loads', (await site.evaluate(() => performance.getEntriesByType('resource').some((r) => r.name.endsWith('/map-land.svg')))))
check('Responsive WebP served (not the full JPEG)', await site.evaluate(() => [...document.images].some((i) => /-640\.webp|-1080\.webp/.test(i.currentSrc))))
check('Page view beacon sent', pings.some((p) => p?.includes('"k":"pv"')), JSON.stringify(pings))
await site.screenshot({ path: `${OUT}/site-home.png` })
await site.goto(SITE + '/products/namaste/', { waitUntil: 'networkidle' })
await site.waitForTimeout(1500)
await site.screenshot({ path: `${OUT}/site-namaste.png`, fullPage: false })
for (const p of ['/story/', '/bulk/', '/contact/', '/products/']) {
  await site.goto(SITE + p, { waitUntil: 'networkidle' })
  await site.waitForTimeout(800)
}
check('No console errors on the site before publishing', errors.length === 0, errors.join('\n'))

// ---------------------------------------------------------------- dashboard
const admin = await ctx.newPage()
watch(admin, 'admin')
await admin.goto(ADMIN + '/')
await admin.fill('input[type=email]', 'owner@test.local')
await admin.fill('input[type=password]', 'test-password-1')
await admin.click('button[type=submit]')
await admin.waitForSelector('text=Money on hand')
await admin.goto(ADMIN + '/website?s=home.hero')
await admin.waitForSelector('text=Headline')
const frame = admin.frameLocator('iframe[title="Website preview"]')
await frame.locator('h1#hero-title').waitFor()
await admin.waitForTimeout(1500)
await admin.screenshot({ path: `${OUT}/admin-editor.png` })

const headline = admin.locator('#f-home-hero-title')
await headline.fill('A cool cloth for a *hot afternoon.*')
await admin.waitForTimeout(800)
const previewH1 = await frame.locator('h1#hero-title').innerText()
check('Preview shows the draft as you type', /hot\s+afternoon/i.test(previewH1), previewH1)
check('Emphasis renders as <em> in the preview', (await frame.locator('h1#hero-title em').innerText()).includes('hot afternoon'))
await admin.waitForSelector('text=Draft saved', { timeout: 8000 })
check('Draft autosaves', true)
await admin.screenshot({ path: `${OUT}/admin-edited.png` })

// Click "Edit" on a section inside the preview → editor opens it.
await frame.locator('[data-cms="home.statement"]').scrollIntoViewIfNeeded()
await frame.locator('[data-cms="home.statement"]').hover({ position: { x: 300, y: 200 } })
await frame.locator('[data-preview-ui] button').click()
await admin.waitForURL(/s=home\.statement/)
check('Edit button in the preview opens that section', admin.url().includes('home.statement'))

// Publish.
await admin.getByRole('button', { name: /^Publish/ }).click()
await admin.waitForSelector('text=What’s changing')
await admin.fill('textarea[placeholder="e.g. New Diwali prices"]', 'E2E headline')
await admin.locator('[role=dialog] button[type=submit]').click()
await admin.waitForSelector('text=It’s live on the website now', { timeout: 10000 })
check('Publish succeeds', true)

// ---------------------------------------------------------------- site picks it up without a rebuild
const fresh = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })
const phone = await fresh.newPage()
watch(phone, 'phone')
await phone.goto(SITE + '/', { waitUntil: 'networkidle' })
await phone.waitForTimeout(2500)
const liveH1 = await phone.locator('h1#hero-title').innerText()
check('Published headline is live on the site (no rebuild)', /hot\s+afternoon/i.test(liveH1), liveH1)
check('Tab title still set', (await phone.title()).length > 0)
await phone.screenshot({ path: `${OUT}/site-phone-live.png` })

// ---------------------------------------------------------------- photo upload from a field
await admin.goto(ADMIN + '/website?s=home.hero')
await admin.waitForSelector('text=First photo')
await admin.getByRole('button', { name: 'Change' }).first().click()
await admin.waitForSelector('text=Choose a photo')
const png = Buffer.from(await (await fetch(SITE + '/products/namaste-cafe.jpg')).arrayBuffer())
await admin.setInputFiles('[role=dialog] input[type=file]', { name: 'cafe-photo.jpg', mimeType: 'image/jpeg', buffer: png })
await admin.waitForSelector('text=Choose a photo', { state: 'detached', timeout: 20000 })
await admin.waitForTimeout(1000)
const src = await frame.locator('[data-hero-card] img').first().getAttribute('src')
check('Uploaded photo appears in the preview', /\/live\/media\//.test(src ?? ''), src)
await admin.screenshot({ path: `${OUT}/admin-photo.png` })

// ---------------------------------------------------------------- analytics screen
await admin.goto(ADMIN + '/analytics')
await admin.waitForSelector('text=What visitors did', { timeout: 10000 })
await admin.waitForTimeout(800)
await admin.screenshot({ path: `${OUT}/admin-analytics.png`, fullPage: true })
check('Analytics shows visitors', (await admin.locator('text=Visitors').count()) > 0)

for (const p of ['/', '/sales', '/stock', '/money', '/expenses', '/amazon', '/samples', '/gst', '/receivables', '/activity', '/settings', '/website/photos']) {
  await admin.goto(ADMIN + p)
  await admin.waitForTimeout(900)
  const broken = await admin.locator('text=This screen hit a problem').count()
  check(`Dashboard ${p} renders`, broken === 0)
}
await admin.goto(ADMIN + '/settings')
await admin.waitForSelector('text=Website storage')
await admin.waitForTimeout(600)
await admin.screenshot({ path: `${OUT}/admin-settings.png`, fullPage: true })

const relevant = errors.filter((e) => !/favicon|__next\..*\.txt|404 \(File not found\)/.test(e))
check('No console errors anywhere', relevant.length === 0, relevant.join('\n'))
writeFileSync(`${OUT}/errors.txt`, errors.join('\n'))
await browser.close()
console.log(failures ? `\n${failures} FAILED` : '\nAll end-to-end checks passed.')
process.exit(failures ? 1 : 0)
