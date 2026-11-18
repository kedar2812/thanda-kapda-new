// Full backup and restore, end to end, through the same code the dashboard runs
// in the browser (admin/web/src/lib/backup.ts). Needs two local API servers on
// scratch databases (see README, Testing): A after acceptance.mjs and
// website.mjs have run on it, and B completely empty, standing in for a new
// server. TK_CONFIG must point at A's config (for backup-seed.php).
//
//   TK_CONFIG=... npx jiti tests/backup.test.ts http://127.0.0.1:8082 http://127.0.0.1:8083
//
// Never point it at real data: it replaces everything on both servers.

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import type * as Fflate from 'fflate'
import { ApiError, OfflineError } from '../../web/src/lib/api'
import { BackupError, RestoreUnknownError, createBackup, readBackup, restoreBackup, type Backup, type Transport } from '../../web/src/lib/backup'

// The zip library is installed with the dashboard's front end (admin/web).
const { strToU8, unzipSync, zipSync } = createRequire(new URL('../../web/package.json', import.meta.url))('fflate') as typeof Fflate
type Zippable = Fflate.Zippable

const [A_URL = 'http://127.0.0.1:8082', B_URL = 'http://127.0.0.1:8083'] = process.argv.slice(2)
let failures = 0
function check(name: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : `  (got ${JSON.stringify(actual)?.slice(0, 300)}, want ${JSON.stringify(expected)?.slice(0, 300)})`}`)
}
async function rejects(name: string, p: Promise<unknown>, match: (e: unknown) => boolean) {
  try {
    await p
    check(name, 'no error', 'an error')
  } catch (e) {
    const ok = match(e)
    check(name, ok ? 'right error' : `${(e as Error)?.constructor?.name}: ${(e as Error)?.message}`, 'right error')
  }
}
const says = (text: string, status?: number) => (e: unknown) => e instanceof Error && e.message.includes(text) && (status === undefined || (e instanceof ApiError && e.status === status))

type Client = Transport & { root: string; raw: (method: string, path: string, body?: BodyInit, type?: string) => Promise<Response> }
function client(root: string): Client {
  let cookie = ''
  async function raw(method: string, path: string, body?: BodyInit, type = 'application/json') {
    let res: Response
    try {
      res = await fetch(`${root}/api/${path}`, { method, headers: { 'Content-Type': type, 'X-TK-Client': '1', Cookie: cookie }, body })
    } catch {
      throw new OfflineError()
    }
    const set = res.headers.get('set-cookie')
    if (set) cookie = set.split(';')[0]
    return res
  }
  async function json<T>(res: Response): Promise<T> {
    const j = await res.json().catch(() => ({ error: `not JSON (${res.status})` }))
    if (!res.ok) throw new ApiError(res.status, j.error, j.code ?? null)
    return j as T
  }
  return {
    root,
    raw,
    get: async <T,>(p: string) => json<T>(await raw('GET', p)),
    getBytes: async (p: string) => {
      const r = await raw('GET', p)
      if (!r.ok) await json(r)
      return new Uint8Array(await r.arrayBuffer())
    },
    post: async <T,>(p: string, b?: unknown, o?: { bytes?: Uint8Array }) =>
      json<T>(o?.bytes ? await raw('POST', p, o.bytes as BodyInit, 'application/octet-stream') : await raw('POST', p, JSON.stringify(b ?? {}))),
  }
}

type Row = Record<string, unknown>
/** Every table, read the way a backup reads it but without logging anything. */
async function dump(c: Client): Promise<Record<string, Row[]>> {
  const m = await c.get<{ tables: Record<string, { upto: number | null }> }>('backup/manifest')
  const out: Record<string, Row[]> = {}
  for (const t of Object.keys(m.tables)) {
    out[t] = []
    let after: unknown = null
    do {
      const page = await c.get<{ rows: Row[]; next: unknown }>(`backup/rows?table=${t}&after=${after === null ? '' : encodeURIComponent(String(after))}`)
      out[t].push(...page.rows)
      after = page.next
    } while (after !== null)
  }
  return out
}
const reports = async (c: Client) => JSON.stringify([await c.get('reports/stock'), await c.get('reports/balances'), await c.get('reports/dashboard'), await c.get('reports/gst'), await c.get('reports/ageing')])
const blobOf = (bytes: Uint8Array) => new Blob([bytes as BlobPart])
const rezip = (files: Zippable) => blobOf(zipSync(files))
const withoutTime = (rows: Row[]) => rows.map(({ at: _at, ...r }) => r)

const A = client(A_URL)
const B = client(B_URL)
await A.post('auth/login', { email: 'owner@test.local', password: 'test-password-1' })

// ---------------------------------------------------------------- setting the scene on A
const party = 'Café “Ñandú” 😀\nsecond line, a \\ backslash and \'quotes\''
await A.post('sales', { date: '2026-02-03', party, quantity: 3, price: 0.1, freight: 12.5, gst_rate: 18, notes: null, payments: [] })
await A.post('users', { name: 'Staff Person', email: 'staff@test.local', password: 'staff-password-1', role: 'staff' })
const staff = client(A_URL)
await staff.post('auth/login', { email: 'staff@test.local', password: 'staff-password-1' })
await rejects('Staff can’t take a full backup (it holds every login)', staff.get('backup/manifest'), says('owner', 403))
await rejects('Staff can’t restore', staff.post('restore/start', { manifest: {} }), says('owner', 403))
const pub = await A.post<{ revision: number }>('cms/publish', {
  data: { site: { name: 'Published “é”' }, home: { hero: { firstPhoto: { src: `${A_URL}/live/media/2026/11/9001-big-2400.png#w=2400` } } } },
  force: true,
})
execFileSync('php', [fileURLToPath(new URL('./backup-seed.php', import.meta.url)), A_URL], { stdio: 'inherit', env: process.env })

// ---------------------------------------------------------------- making the backup
// A partner saves something while the backup is being read: it must start again so the file is one moment in time.
let manifests = 0
const sneaky: Transport = {
  ...A,
  get: async <T,>(p: string) => {
    const r = await A.get<T>(p)
    if (p === 'backup/manifest' && ++manifests === 1) await A.post('todos', { title: 'Added during the backup', priority: 'High' })
    return r
  },
}
const labels = new Set<string>()
const made = await createBackup(sneaky, (p) => labels.add(p.label.replace(/\(.*\)/, '').trim()))
check('A change during the backup makes it read everything again', manifests, 2)
check('Progress is reported', [...labels].sort(), ['Packing the zip file', 'Reading photos', 'Reading records'])
check('The stray non-photo file is left out and reported', made.skipped, ['stray.txt'])
check('File name says what and when', /^thanda-kapda-backup-\d{4}-\d{2}-\d{2}-\d{4}\.zip$/.test(made.filename), true)
const zipBytes = new Uint8Array(await made.blob.arrayBuffer())
const entries = unzipSync(zipBytes)
check('Zip has a manifest, a README, a file per table and the photos', ['manifest.json', 'README.txt', 'data/users.json', 'data/analytics_views.json', 'media/2026/11/9001-big-2400.png'].every((k) => k in entries), true)

const truth = await dump(A) // what A holds now (the backup must match it exactly)
const backup = await readBackup(made.blob)
check('Every table is in the backup', Object.keys(backup.tables).sort(), Object.keys(truth).sort())
for (const t of Object.keys(truth)) {
  if (t === 'activity_log') continue // the backup itself was logged after it was read
  check(`Backup holds ${t} exactly (${truth[t].length} records)`, backup.tables[t], truth[t])
}
check('Activity history is in the backup', backup.tables.activity_log, truth.activity_log.slice(0, -1))
check('Paging: every visitor page view (more than two pages)', [backup.tables.analytics_views.length > 4000, backup.tables.analytics_views.length], [true, truth.analytics_views.length])
check('Logins travel with their scrambled passwords', backup.tables.users.every((u) => typeof u.password_hash === 'string' && String(u.password_hash).startsWith('$')), true)
check('Server-only settings stay out', backup.tables.settings.some((s) => s.k === 'schema_version' || s.k === 'analytics_salt'), false)
check('Money keeps its exact decimals', backup.tables.sales.find((s) => s.party === party)?.price, '0.10')
check('Photo larger than one upload piece is whole', backup.files.get('2026/11/9001-big-2400.png')?.length, 2700033)
check('An empty file is kept as it is', backup.files.get('2026/11/9002-empty-640.webp')?.length, 0)
const beforeReports = await reports(A)

// ---------------------------------------------------------------- restoring on a brand-new server
await B.post('auth/setup', { name: 'New Owner', email: 'new@test.local', password: 'new-password-1' })
// A shaky connection: every third request fails once before it reaches the server.
let calls = 0
const flaky: Transport = {
  ...B,
  post: async <T,>(p: string, b?: unknown, o?: { bytes?: Uint8Array }) => {
    if (!p.startsWith('restore/finish') && ++calls % 3 === 0) throw new OfflineError()
    return B.post<T>(p, b, o)
  },
}
const restored = await restoreBackup(flaky, backup)
check('Restore survives a shaky connection', restored.files, backup.files.size)
check('The person restoring is told their login was added', restored.notes.some((n) => n.includes('new@test.local') && n.includes('added')), true)
check('Photo links are moved to the new server', restored.notes.some((n) => n.includes(B_URL)), true)
const me = (await B.get<{ user: { email: string; role: string } }>('bootstrap')).user
check('The person restoring is still signed in, as an owner', [me.email, me.role], ['new@test.local', 'owner'])

const onB = await dump(B)
const moved = (rows: Row[]) => JSON.parse(JSON.stringify(rows).replaceAll(`${A_URL}/live/media/`, `${B_URL}/live/media/`))
for (const t of Object.keys(truth)) {
  if (['users', 'activity_log', 'cms_revisions', 'cms_draft'].includes(t)) continue
  check(`New server has ${t} exactly`, onB[t], backup.tables[t])
}
check('Website versions match, links pointing at the new server', onB.cms_revisions, moved(backup.tables.cms_revisions))
check('Unpublished draft matches, links pointing at the new server', onB.cms_draft, moved(backup.tables.cms_draft))
check('Logins match, plus the new owner', onB.users.slice(0, -1), backup.tables.users)
check('History matches, plus one line saying it was restored', [onB.activity_log.slice(0, -1), onB.activity_log.at(-1)?.action], [backup.tables.activity_log, 'restored'])
check('Every figure is identical (stock, balances, overview, GST, owed)', await reports(B), beforeReports)
const live = await (await fetch(`${B_URL}/live/content.json`)).json()
check('The website shows the restored version', [live.version, live.content.site.name], [pub.revision, 'Published “é”'])
check('…with photos from the new server', live.content.home.hero.firstPhoto.src.startsWith(`${B_URL}/live/media/`), true)
const big = new Uint8Array(await (await fetch(`${B_URL}/live/media/2026/11/9001-big-2400.png`)).arrayBuffer())
check('Photo files are byte-for-byte the same', Buffer.compare(big, backup.files.get('2026/11/9001-big-2400.png')!), 0)
check('The old owner can sign in on the new server', (await client(B_URL).post<{ user: { email: string } }>('auth/login', { email: 'owner@test.local', password: 'test-password-1' })).user.email, 'owner@test.local')
const newSale = await B.post<{ id: number }>('sales', { date: '2026-11-18', party: 'After restore', quantity: 1, price: 5, payments: [] })
check('New records carry on after the restored ones', newSale.id > Math.max(...backup.tables.sales.map((s) => Number(s.id))), true)

// A backup of B gives the same data back again (round trip).
const again = await readBackup((await createBackup(B)).blob)
check('Round trip: photos identical', [...again.files.keys()], [...backup.files.keys()])
check('Round trip: visitor numbers identical', again.tables.analytics_views, backup.tables.analytics_views)

// ---------------------------------------------------------------- bad files are refused before anything changes
const snapB = JSON.stringify(withoutLog(await dump(B)))
function withoutLog(d: Record<string, Row[]>) {
  return { ...d, activity_log: withoutTime(d.activity_log) }
}
const unchanged = async (name: string) => check(`${name}: nothing changed`, JSON.stringify(withoutLog(await dump(B))), snapB)

await rejects('A file that isn’t a zip is refused', readBackup(blobOf(strToU8('hello'))), (e) => e instanceof BackupError && e.message.includes('isn’t a backup'))
await rejects('A cut-off zip is refused', readBackup(blobOf(zipBytes.subarray(0, zipBytes.length - 5000))), (e) => e instanceof BackupError)
await rejects('Some other zip is refused', readBackup(rezip({ 'photo.jpg': strToU8('x') })), (e) => e instanceof BackupError && e.message.includes('manifest'))
const tampered = { ...entries, 'media/2026/11/9001-big-2400.png': entries['media/2026/11/9001-big-2400.png'].slice() }
tampered['media/2026/11/9001-big-2400.png'][5000] ^= 0xff
await rejects('A changed photo is caught', readBackup(rezip(tampered)), (e) => e instanceof BackupError && e.message.includes('9001-big-2400.png'))
const { 'data/sales.json': _gone, ...noSales } = entries
await rejects('A missing table is caught', readBackup(rezip(noSales)), (e) => e instanceof BackupError && e.message.includes('data/sales.json is missing'))
const fewer = { ...entries, 'data/todos.json': strToU8('[]') }
await rejects('A table with records removed is caught', readBackup(rezip(fewer)), (e) => e instanceof BackupError && e.message.includes('todos'))
const wrapped = Object.fromEntries(Object.entries(entries).map(([k, v]) => [`thanda-kapda-backup/${k}`, v]))
check('A backup unzipped and zipped again (one folder around it) still opens', (await readBackup(rezip(wrapped))).files.size, backup.files.size)

const m = backup.manifest
const start = (manifest: unknown) => B.post('restore/start', { manifest })
await rejects('A backup from a newer dashboard is refused', start({ ...m, schema: 99 }), says('newer version', 422))
await rejects('Unknown information is refused, not dropped', start({ ...m, tables: { ...m.tables, sales: { ...m.tables.sales, columns: [...m.tables.sales.columns, 'colour'] } } }), says('colour', 422))
await rejects('An unknown table is refused', start({ ...m, tables: { ...m.tables, invoices: { count: 0, columns: [] } } }), says('invoices', 422))
const { todos: _t, ...lessTables } = m.tables
await rejects('A full backup missing a table is refused', start({ ...m, tables: lessTables }), says('incomplete', 422))
for (const path of ['../../index.php', 'a/../../x.png', '2026/x.php', '.htaccess', '2026/.hidden.png', 'C:/x.png'])
  await rejects(`A photo path that escapes the folder is refused (${path})`, start({ ...m, files: [{ path, bytes: 1, sha256: '0'.repeat(64) }] }), says('photo entry', 422))
await rejects('Something that isn’t a backup at all is refused', start({ app: 'other' }), says('not a Thanda Kapda backup', 422))
await rejects('An unknown restore can’t be finished', B.post('restore/finish?token=' + '0'.repeat(32)), says('expired', 410))

// Pieces missing or damaged on the server's side.
const half = await B.post<{ token: string }>('restore/start', { manifest: m })
await B.post(`restore/rows?token=${half.token}&table=sales&seq=0`, { rows: backup.tables.sales })
await rejects('Finishing with pieces missing is refused', B.post(`restore/finish?token=${half.token}`), says('didn’t arrive complete', 422))
await rejects('A record that doesn’t match its table is refused', B.post(`restore/rows?token=${half.token}&table=sales&seq=1`, { rows: [{ nope: 1 }] }), says('doesn’t match', 422))
await rejects('A photo piece past the end of the file is refused', B.post(`restore/file?token=${half.token}&path=2026/11/9002-empty-640.webp&offset=0&size=10`, undefined, { bytes: new Uint8Array(10) }), says('damaged', 422))
await rejects('A piece whose size doesn’t match what was sent is refused', B.post(`restore/file?token=${half.token}&path=2026/11/9001-big-2400.png&offset=0&size=11`, undefined, { bytes: new Uint8Array(10) }), says('damaged', 422))
await B.post(`restore/cancel?token=${half.token}`)
await unchanged('After refused and half-finished restores')

const evil: Transport = {
  ...B,
  post: async <T,>(p: string, b?: unknown, o?: { bytes?: Uint8Array }) => {
    if (o?.bytes && p.includes('9001-big') && p.includes('offset=0&')) {
      const bad = o.bytes.slice()
      bad[100] ^= 1
      return B.post<T>(p, b, { bytes: bad })
    }
    return B.post<T>(p, b, o)
  },
}
await rejects('A photo damaged on the way is caught by the server', restoreBackup(evil, backup), says('9001-big-2400.png didn’t arrive intact', 422))
await unchanged('After a photo damaged on the way')

// The database refuses part-way through (two records with the same id): everything is rolled back.
const dupe: Backup = { ...backup, tables: { ...backup.tables, todos: [...backup.tables.todos, backup.tables.todos[0]] } }
dupe.manifest = { ...m, tables: { ...m.tables, todos: { ...m.tables.todos, count: m.tables.todos.count + 1 } } }
await rejects('A restore the database rejects half-way…', restoreBackup(B, dupe), (e) => e instanceof ApiError && e.status === 500)
await unchanged('…is rolled back completely')
check('…and the photos are untouched', (await fetch(`${B_URL}/live/media/2026/11/9001-big-2400.png`)).status, 200)
check('…and the website still shows the same version', (await (await fetch(`${B_URL}/live/content.json`)).json()).version, pub.revision)

// ---------------------------------------------------------------- old single-file backups
const oldFile = { app: 'thanda-kapda-dashboard', version: 2, created_at: '2026-10-01 10:00:00', tables: { ...backup.tables, users: undefined, activity_log: undefined, analytics_views: undefined, analytics_events: undefined } }
for (const k of ['users', 'activity_log', 'analytics_views', 'analytics_events']) delete (oldFile.tables as Record<string, unknown>)[k]
oldFile.tables.sales = backup.tables.sales.slice(0, 2)
oldFile.tables.sale_payments = backup.tables.sale_payments.filter((p) => oldFile.tables.sales.some((s) => s.id === p.sale_id))
const oldBackup = await readBackup(blobOf(strToU8(JSON.stringify(oldFile))))
check('An old .json backup opens as a partial restore', [oldBackup.manifest.partial, oldBackup.files.size], [true, 0])
const usersBefore = (await dump(B)).users
await restoreBackup(B, oldBackup)
const afterOld = await dump(B)
check('Old backup: its records are restored', afterOld.sales, oldFile.tables.sales)
check('Old backup: logins are left alone', afterOld.users, usersBefore)
check('Old backup: visitor numbers are left alone', afterOld.analytics_views.length, backup.tables.analytics_views.length)
check('Old backup: photos are left alone', (await fetch(`${B_URL}/live/media/2026/11/9001-big-2400.png`)).status, 200)

// ---------------------------------------------------------------- restoring onto the same server
const ownerOnA = (await A.get<{ user: { id: number } }>('bootstrap')).user.id
check('Staff is signed in on A before the restore', (await staff.raw('GET', 'bootstrap')).status, 200)
const sameServer = await restoreBackup(A, backup)
check('Restoring in place keeps your password', sameServer.notes.some((n) => n.includes('keep the password')), true)
check('Everyone else is signed out', (await staff.raw('GET', 'bootstrap')).status, 401)
check('You stay signed in', (await A.get<{ user: { id: number } }>('bootstrap')).user.id, ownerOnA)
check('In place: figures match the moment of the backup', await reports(A), beforeReports)
check('In place: the todo added during the backup is there', (await dump(A)).todos.some((t) => t.title === 'Added during the backup'), true)

// ---------------------------------------------------------------- the line drops while the server is finishing
const dropping: Transport = {
  ...B,
  post: async <T,>(p: string, b?: unknown, o?: { bytes?: Uint8Array }) => {
    const r = await B.post<T>(p, b, o)
    if (p.startsWith('restore/finish')) throw new OfflineError()
    return r
  },
}
await rejects('A dropped line while finishing says to check, not that it failed', restoreBackup(dropping, backup), (e) => e instanceof RestoreUnknownError)
check('…and the server finished the restore anyway', (await dump(B)).sales.length, backup.tables.sales.length)

// ---------------------------------------------------------------- nothing is left out
const tables = await B.get<{ tables: Record<string, unknown> }>('backup/manifest')
const inDb = execFileSync('php', ['-r', `require 'src/core.php'; echo json_encode(array_column(rows('SHOW TABLES'), array_key_first(rows('SHOW TABLES')[0])));`], { env: process.env, cwd: fileURLToPath(new URL('..', import.meta.url)) }).toString()
const skipped = ['sessions', 'login_attempts', 'restore_parts']
check('Every database table is either backed up or deliberately skipped', (JSON.parse(inDb) as string[]).filter((t) => !(t in tables.tables) && !skipped.includes(t)), [])

console.log(failures ? `\n${failures} FAILED` : '\nAll backup tests passed.')
process.exit(failures ? 1 : 0)
