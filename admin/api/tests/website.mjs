// Tests for website content (drafts, publishing, history), photos, visitor
// analytics and backups. Run after acceptance.mjs against the SAME scratch
// database (it signs in as the owner that test created):
//   node tests/acceptance.mjs http://127.0.0.1:8082 && node tests/website.mjs http://127.0.0.1:8082
// Never point it at production data.

import { deflateSync } from 'node:zlib'

const root = process.argv[2] ?? 'http://127.0.0.1:8082'
const base = root + '/api/'
let cookie = ''
let failures = 0

async function api(method, path, body, headers = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-TK-Client': '1', Cookie: cookie, ...headers },
    body: body === undefined ? undefined : typeof body === 'string' || body instanceof FormData ? body : JSON.stringify(body),
  })
  const set = res.headers.get('set-cookie')
  if (set) cookie = set.split(';')[0]
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  return { status: res.status, json }
}
async function ok(method, path, body) {
  const r = await api(method, path, body)
  if (r.status >= 400) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(r.json)}`)
  return r.json
}
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`)
}

/** A solid-colour PNG of the given size, built by hand so the test needs no packages. */
function png(w, h) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (buf) => {
    let c = 0xffffffff
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const c = Buffer.alloc(4)
    c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, 0x7a)])
  const raw = Buffer.concat(Array.from({ length: h }, () => row))
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

await ok('POST', 'auth/login', { email: 'owner@test.local', password: 'test-password-1' })

// ---------------------------------------------------------------- content
let s = await ok('GET', 'cms')
check('Starts with no draft and nothing published', [s.draft, s.published], [null, null])
check('Live folder is writable', s.storage_ok, true)

const draft1 = { site: { name: 'Test Co.' }, home: { hero: { title: 'Hello *world*' } } }
const save1 = await ok('PUT', 'cms/draft', { data: draft1, updated_at: s.draft_updated_at })
check('Draft saves', typeof save1.updated_at, 'string')

const stale = await api('PUT', 'cms/draft', { data: draft1, updated_at: null })
check('Saving over someone else’s newer draft is refused', [stale.status, stale.json.code], [409, 'conflict'])

// Same second as the first save would look identical; wait so the timestamps differ.
await new Promise((r) => setTimeout(r, 1100))
const save2 = await ok('PUT', 'cms/draft', { data: { ...draft1, faq: { eyebrow: 'Q' } }, updated_at: save1.updated_at })
check('Draft saves again with the latest stamp', save2.updated_at > save1.updated_at, true)

const bad = await api('PUT', 'cms/draft', { data: ['not', 'an', 'object'], updated_at: save2.updated_at })
check('A list instead of content is rejected', bad.status, 422)

const pub = await ok('POST', 'cms/publish', { data: draft1, updated_at: save2.updated_at, note: 'First go' })
check('Publishing returns a revision', pub.revision > 0, true)

const live = await (await fetch(`${root}/live/content.json`)).json()
check('Live file has the new version', [live.version, live.content.site.name], [pub.revision, 'Test Co.'])

s = await ok('GET', 'cms')
check('After publishing the draft is clear', [s.draft, s.published.id, s.published.note], [null, pub.revision, 'First go'])

const revs = await ok('GET', 'cms/revisions')
check('History lists the revision', revs.map((r) => r.id), [pub.revision])
const rev = await ok('GET', `cms/revisions/${pub.revision}`)
check('A revision returns its content', rev.data.home.hero.title, 'Hello *world*')

const fallback = await ok('GET', 'public/content')
check('Public content endpoint matches the file', fallback.version, pub.revision)

const discard = await ok('PUT', 'cms/draft', { data: { site: { name: 'Draft only' } }, updated_at: s.draft_updated_at })
await ok('DELETE', 'cms/draft')
check('Discard clears the draft', (await ok('GET', 'cms')).draft, null)
check('Discarding leaves the live site alone', (await (await fetch(`${root}/live/content.json`)).json()).content.site.name, 'Test Co.')
void discard

// ---------------------------------------------------------------- photos
const form = new FormData()
form.append('name', 'Café table.jpg')
form.append('alt', 'A sachet on a table')
form.append('w640', new Blob([png(640, 427)], { type: 'image/png' }), 'w640.png')
form.append('w1080', new Blob([png(1080, 720)], { type: 'image/png' }), 'w1080.png')
const up = await fetch(base + 'media', { method: 'POST', headers: { 'X-TK-Client': '1', Cookie: cookie }, body: form })
const photo = await up.json()
check('Photo uploads', [up.status, photo.widths, photo.width, photo.height], [200, [640, 1080], 1080, 720])
check('Photo src carries its sizes', photo.src.endsWith('-1080.png#w=640,1080'), true)
const file = await fetch(photo.thumb)
check('Smallest size is served', [file.status, file.headers.get('content-type')], [200, 'image/png'])

const wrong = new FormData()
wrong.append('w800', new Blob([png(640, 427)], { type: 'image/png' }), 'w800.png')
const wr = await fetch(base + 'media', { method: 'POST', headers: { 'X-TK-Client': '1', Cookie: cookie }, body: wrong })
check('A size that doesn’t match its label is refused', wr.status, 422)

const notImage = new FormData()
notImage.append('w640', new Blob(['<?php echo 1;'], { type: 'image/png' }), 'evil.php')
const ni = await fetch(base + 'media', { method: 'POST', headers: { 'X-TK-Client': '1', Cookie: cookie }, body: notImage })
check('Something that isn’t a photo is refused', ni.status, 422)

await ok('PUT', `media/${photo.id}`, { alt: 'Updated alt' })
check('Alt text can be changed', (await ok('GET', 'media')).find((m) => m.id === photo.id).alt, 'Updated alt')

s = await ok('GET', 'cms')
const usedDraft = { ...draft1, home: { hero: { firstPhoto: { src: photo.src, alt: '', width: 1080, height: 720, focus: '50% 50%', zoom: 1 } } } }
await ok('PUT', 'cms/draft', { data: usedDraft, updated_at: s.draft_updated_at })
const usage = await ok('GET', `media/${photo.id}`)
check('Usage is found', usage.used_in, ['home.hero.firstPhoto'])
const blocked = await api('DELETE', `media/${photo.id}`)
check('A photo in use can’t be deleted', [blocked.status, blocked.json.code], [422, 'in_use'])
await ok('DELETE', 'cms/draft')
await ok('DELETE', `media/${photo.id}`)
check('Unused photo deletes, with its files', (await fetch(photo.thumb)).status, 404)

// ---------------------------------------------------------------- analytics
const site = 'http://localhost:3000'
const phone = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'
const beacon = (body, ua = phone, origin = site) =>
  fetch(base + 'public/ping', { method: 'POST', headers: { 'Content-Type': 'text/plain', Origin: origin, 'User-Agent': ua }, body: JSON.stringify(body) })

const b1 = await beacon({ k: 'pv', id: 'aaaaaaaaaaaaaaaa', p: '/', r: 'https://www.google.com/', w: 412, tz: 'Asia/Calcutta', l: 'en-IN' })
check('Beacon is accepted without a login or custom header', b1.status, 204)
await beacon({ k: 'pv', id: 'bbbbbbbbbbbbbbbb', p: '/products/namaste/', r: '', w: 412, tz: 'Asia/Calcutta' })
await beacon({ k: 'eng', id: 'bbbbbbbbbbbbbbbb', t: 42, d: 80 })
await beacon({ k: 'ev', pv: 'bbbbbbbbbbbbbbbb', n: 'amazon', x: 'B0HGYP6TYC', p: '/products/namaste/' })
await beacon({ k: 'ev', pv: 'bbbbbbbbbbbbbbbb', n: 'not-a-goal', p: '/' })
await beacon({ k: 'pv', id: 'cccccccccccccccc', p: '/', w: 1440 }, 'Mozilla/5.0 (compatible; Googlebot/2.1)')
await beacon({ k: 'pv', id: 'dddddddddddddddd', p: '/' }, phone, 'https://evil.example')
await beacon({ k: 'pv', id: 'eeeeeeeeeeeeeeee', p: '/bulk/', r: 'https://l.instagram.com/', w: 1440, tz: 'Asia/Dubai' }, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36')
await beacon({ k: 'pv', id: 'aaaaaaaaaaaaaaaa', p: '/' }) // replayed id: ignored

const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)
const o = await ok('GET', `analytics/overview?from=${today}&to=${today}`)
check('Bots, other sites and replays are not counted', [o.totals.visitors, o.totals.views], [2, 3])
check('Visits are grouped into sessions', o.totals.sessions, 2)
check('A one-page, short visit is a bounce', o.totals.bounce_rate, 50)
check('Goals are counted, unknown ones ignored', [o.goals.amazon?.count, o.goals['not-a-goal']], [1, undefined])
check('Goal labels are kept', o.goals.amazon.labels, [{ label: 'B0HGYP6TYC', count: 1 }])
check('Sources are grouped', o.sources.map((x) => x.label).sort(), ['Google', 'Instagram'])
check('Countries come from the time zone', o.countries.map((x) => x.label).sort(), ['AE', 'IN'])
check('Devices are told apart', o.devices.map((x) => x.label).sort(), ['desktop', 'mobile'])
check('Time on page and scroll are recorded', o.pages.find((p) => p.path === '/products/namaste/')?.avg_engaged, 42)
check('Single day is shown by hour', o.series.length, 24)
const week = await ok('GET', `analytics/overview?to=${today}`)
check('Default range is 30 days', week.series.length, 30)
const now = await ok('GET', 'analytics/live')
check('Live count sees current visitors', now.visitors, 2)
const anon = await fetch(base + 'analytics/overview', { headers: {} })
check('Analytics needs a login', anon.status, 401)

// ---------------------------------------------------------------- backups
const backup = await ok('GET', 'backup')
check('Backup includes website history', backup.tables.cms_revisions.length, 1)
check('Backup leaves out server-only settings', backup.tables.settings.some((r) => r.k === 'schema_version' || r.k === 'analytics_salt'), false)
const old = { ...backup, version: 1, tables: { ...backup.tables } }
delete old.tables.cms_revisions
delete old.tables.cms_draft
delete old.tables.cms_media
await ok('POST', 'restore', old)
check('An older backup (no website tables) restores and keeps the website', (await ok('GET', 'cms')).published?.id, pub.revision)
check('Schema version survives a restore', (await ok('GET', 'public/health')).schema, 2)
await ok('POST', 'restore', backup)
const afterSave = await ok('GET', 'cms')
await ok('PUT', 'cms/draft', { data: draft1, updated_at: afterSave.draft_updated_at })
check('Drafts still save after a restore', (await ok('GET', 'cms')).draft?.site?.name, 'Test Co.')

console.log(failures ? `\n${failures} FAILED` : '\nAll website tests passed.')
process.exit(failures ? 1 : 0)
