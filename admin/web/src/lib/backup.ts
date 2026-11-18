// Full backup of the dashboard and website as one .zip, and restoring it.
//
//   manifest.json        what's inside: every table's record count and columns, every photo's size and SHA-256
//   README.txt           what this file is and how to restore it
//   data/<table>.json    every record, exactly as stored (one per line)
//   media/<path>         every photo file the website uses
//
// The browser builds and reads the zip; the server (admin/api/src/backup.php)
// hands out data page by page and takes a restore back in small pieces, then
// swaps everything in at once. No React or path aliases here, so the tests can
// drive this same code from Node.

import { strFromU8, strToU8, unzip, zip, type AsyncZippable, type Unzipped } from 'fflate'
import { ApiError, OfflineError } from './api'

export interface Transport {
  get<T>(path: string): Promise<T>
  getBytes(path: string): Promise<Uint8Array>
  post<T>(path: string, body?: unknown, opts?: { timeout?: number; bytes?: Uint8Array }): Promise<T>
}

export interface BackupFile { path: string; bytes: number; sha256: string }
type Row = Record<string, unknown>

export interface Manifest {
  app: 'thanda-kapda-dashboard'
  format: number
  schema: number
  created_at: string
  public_base: string | null
  business?: string | null
  /** An old single-file (.json) backup: only the tables in it are replaced. */
  partial?: boolean
  tables: Record<string, { count: number; columns: string[] }>
  files: BackupFile[]
}

export interface Backup {
  manifest: Manifest
  tables: Record<string, Row[]>
  files: Map<string, Uint8Array>
}

export interface Progress { label: string; done: number; total: number }
type OnProgress = (p: Progress) => void

export interface RestoreResult { restored: Record<string, number>; files: number; notes: string[] }

/** A problem with the file itself, explained for the person who chose it. */
export class BackupError extends Error {}

const APP = 'thanda-kapda-dashboard'
const PIECE = 1024 * 1024 // per upload request, far below any host's limit
const ROWS_PIECE = 800 * 1024

// ---------------------------------------------------------------- shared

async function sha256(bytes: Uint8Array): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return null // not on https: the server still checks every file
  const hash = new Uint8Array(await subtle.digest('SHA-256', bytes as BufferSource))
  return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Retries what a flaky connection or a busy server can break; anything else fails straight away. */
async function retry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn()
    } catch (e) {
      const transient = e instanceof OfflineError || (e instanceof ApiError && (e.status >= 500 || e.status === 429))
      if (!transient || i >= tries) throw e
      await new Promise((r) => setTimeout(r, 1000 * i))
    }
  }
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export function summary(b: Backup) {
  return {
    createdAt: b.manifest.created_at,
    business: b.manifest.business ?? null,
    partial: !!b.manifest.partial,
    records: sum(Object.values(b.tables).map((r) => r.length)),
    photos: b.files.size,
    photoBytes: sum([...b.files.values()].map((f) => f.length)),
    logins: b.tables.users?.length ?? null,
    websiteVersions: b.tables.cms_revisions?.length ?? null,
  }
}

// ---------------------------------------------------------------- making a backup

interface ServerManifest {
  app: string
  format: number
  schema: number
  created_at: string
  version: number
  public_base: string
  business: string | null
  tables: Record<string, { columns: string[]; key: string; upto: number | null }>
  files: BackupFile[]
  skipped_files: string[]
}

async function readTable(t: Transport, name: string, upto: number | null): Promise<Row[]> {
  const rows: Row[] = []
  let after: string | number | null = null
  do {
    const qs: string = `table=${name}&upto=${upto ?? ''}&after=${after === null ? '' : encodeURIComponent(String(after))}`
    const page: { rows: Row[]; next: string | number | null } = await retry(() => t.get(`backup/rows?${qs}`))
    rows.push(...page.rows)
    after = page.next
  } while (after !== null)
  return rows
}

async function readFile(t: Transport, f: BackupFile): Promise<Uint8Array> {
  for (let attempt = 1; ; attempt++) {
    const bytes = await retry(() => t.getBytes(`backup/file?path=${encodeURIComponent(f.path)}`))
    const hash = await sha256(bytes)
    if (bytes.length === f.bytes && (hash === null || hash === f.sha256)) return bytes
    if (attempt >= 2) throw new Error(`The photo file ${f.path} didn’t download correctly. Please try again.`)
  }
}

function readme(m: Manifest, records: number): string {
  return `Thanda Kapda — full backup of the dashboard and website
Made ${m.created_at} (India time) from ${m.public_base ?? 'the dashboard'}

What's inside
  ${records} records: sales, expenses, Amazon, GST, money, stock, samples, to-dos,
  logins, the activity history, visitor statistics and every published version
  of the website's words.
  ${m.files.length} photo files used by the website (media/).

How to restore it
  1. Sign in to the dashboard as an owner (on a new server, create the first
     login when it asks).
  2. Settings → Backup → Restore from a backup, and choose this .zip file.
  3. Check the summary and press Restore. Everything is checked before
     anything changes; if anything is missing or damaged, nothing changes.

Keep this file somewhere safe (a USB drive, Google Drive). It contains every
login (passwords are stored scrambled, not readable) and all business figures.
Don't edit the files inside: each one is checked when restoring.
`
}

function tableJson(rows: Row[]): string {
  // One record per line, so the file is readable and diffs well.
  return rows.length ? `[\n${rows.map((r) => JSON.stringify(r)).join(',\n')}\n]\n` : '[]\n'
}

export async function createBackup(t: Transport, onProgress: OnProgress = () => {}) {
  for (let attempt = 1; ; attempt++) {
    onProgress({ label: 'Reading records', done: 0, total: 1 })
    const m = await retry(() => t.get<ServerManifest>('backup/manifest'))
    const tables: Record<string, Row[]> = {}
    const names = Object.keys(m.tables)
    for (const [i, name] of names.entries()) {
      onProgress({ label: 'Reading records', done: i, total: names.length })
      tables[name] = await readTable(t, name, m.tables[name].upto)
    }
    const files = new Map<string, Uint8Array>()
    const totalBytes = sum(m.files.map((f) => f.bytes))
    let got = 0
    for (const f of m.files) {
      onProgress({ label: `Reading photos (${files.size + 1} of ${m.files.length})`, done: got, total: totalBytes })
      files.set(f.path, await readFile(t, f))
      got += f.bytes
    }
    // Someone saved something while this was reading: read it all again so the backup is one moment in time.
    const { version } = await retry(() => t.get<{ version: number }>('version'))
    if (version !== m.version) {
      if (attempt < 3) continue
      throw new Error('Records kept changing while the backup was being made. Please try again in a quieter moment.')
    }

    onProgress({ label: 'Packing the zip file', done: 0, total: 1 })
    const manifest: Manifest = {
      app: APP,
      format: m.format,
      schema: m.schema,
      created_at: m.created_at,
      public_base: m.public_base,
      business: m.business,
      tables: Object.fromEntries(names.map((n) => [n, { count: tables[n].length, columns: m.tables[n].columns }])),
      files: m.files,
    }
    const records = sum(Object.values(tables).map((r) => r.length))
    const entries: AsyncZippable = {
      'manifest.json': strToU8(JSON.stringify(manifest, null, 1)),
      'README.txt': strToU8(readme(manifest, records).replace(/\n/g, '\r\n')),
    }
    for (const n of names) entries[`data/${n}.json`] = strToU8(tableJson(tables[n]))
    // Photos are already compressed; storing them as they are is much faster.
    for (const [path, bytes] of files) entries[`media/${path}`] = [bytes, { level: 0 }]
    const zipped = await new Promise<Uint8Array>((resolve, reject) => zip(entries, { level: 6 }, (e, d) => (e ? reject(e) : resolve(d))))

    await t.post('backup/done', { records, files: files.size }).catch(() => {})
    const stamp = m.created_at.slice(0, 16).replace(' ', '-').replace(':', '')
    return {
      blob: new Blob([zipped as BlobPart], { type: 'application/zip' }),
      filename: `thanda-kapda-backup-${stamp}.zip`,
      records,
      files: files.size,
      skipped: m.skipped_files,
    }
  }
}

// ---------------------------------------------------------------- reading a backup file

function parseJson(bytes: Uint8Array, what: string): unknown {
  try {
    return JSON.parse(strFromU8(bytes).replace(/^﻿/, ''))
  } catch {
    throw new BackupError(`This backup is damaged: ${what} can’t be read.`)
  }
}

/** Backups from before the .zip (one JSON file of business records, no photos or logins). */
function fromOldJson(bytes: Uint8Array): Backup {
  const old = parseJson(bytes, 'the file') as { app?: string; version?: number; created_at?: string; tables?: Record<string, unknown> }
  if (old?.app !== APP || !old.tables || typeof old.tables !== 'object') {
    throw new BackupError('This isn’t a Thanda Kapda backup. Choose the .zip file you downloaded from Settings → Backup.')
  }
  const tables: Record<string, Row[]> = {}
  for (const [name, rows] of Object.entries(old.tables)) {
    if (!Array.isArray(rows)) throw new BackupError(`This backup is damaged: the list “${name}” can’t be read.`)
    tables[name] = rows as Row[]
  }
  const columns = (rows: Row[]) => [...new Set(rows.flatMap((r) => Object.keys(r ?? {})))]
  return {
    manifest: {
      app: APP,
      format: 3,
      schema: 3,
      created_at: old.created_at ?? '',
      public_base: null,
      partial: true,
      tables: Object.fromEntries(Object.entries(tables).map(([n, r]) => [n, { count: r.length, columns: columns(r) }])),
      files: [],
    },
    tables,
    files: new Map(),
  }
}

/** Opens a backup file and checks every part of it against its manifest, before anything is sent. */
export async function readBackup(file: Blob, onProgress: OnProgress = () => {}): Promise<Backup> {
  onProgress({ label: 'Opening the backup', done: 0, total: 1 })
  const bytes = new Uint8Array(await file.arrayBuffer())
  const start = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0
  if (bytes[start] === 0x7b /* { */) return fromOldJson(bytes)
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new BackupError('This isn’t a backup file. Choose the .zip file you downloaded from Settings → Backup.')
  }
  let entries: Unzipped
  try {
    entries = await new Promise<Unzipped>((resolve, reject) => unzip(bytes, (e, d) => (e ? reject(e) : resolve(d))))
  } catch {
    throw new BackupError('This zip file is damaged and can’t be opened. Try another copy of the backup.')
  }

  // Unzipping and zipping again on a computer often adds one folder around everything.
  const manifestKey = Object.keys(entries).filter((k) => /^([^/]+\/)?manifest\.json$/.test(k)).sort((a, b) => a.length - b.length)[0]
  if (!manifestKey) throw new BackupError('This zip isn’t a Thanda Kapda backup (it has no manifest.json).')
  const prefix = manifestKey.slice(0, -'manifest.json'.length)
  const m = parseJson(entries[manifestKey], 'its contents list (manifest.json)') as Manifest
  if (m?.app !== APP) throw new BackupError('This zip isn’t a Thanda Kapda backup.')
  if (typeof m.tables !== 'object' || !m.tables || !Array.isArray(m.files)) throw new BackupError('This backup is damaged: its contents list is incomplete.')

  const problems: string[] = []
  const tables: Record<string, Row[]> = {}
  for (const [name, info] of Object.entries(m.tables)) {
    const entry = entries[`${prefix}data/${name}.json`]
    if (!entry) {
      problems.push(`data/${name}.json is missing`)
      continue
    }
    const rows = parseJson(entry, `data/${name}.json`)
    if (!Array.isArray(rows)) problems.push(`data/${name}.json isn’t a list`)
    else if (rows.length !== info?.count) problems.push(`data/${name}.json has ${rows.length} records instead of ${info?.count}`)
    else tables[name] = rows as Row[]
  }
  const files = new Map<string, Uint8Array>()
  for (const [i, f] of m.files.entries()) {
    if (i % 20 === 0) onProgress({ label: 'Checking photos', done: i, total: m.files.length })
    const entry = entries[`${prefix}media/${f.path}`]
    if (!entry) {
      problems.push(`photo ${f.path} is missing`)
      continue
    }
    const hash = await sha256(entry)
    if (entry.length !== f.bytes || (hash !== null && hash !== f.sha256)) problems.push(`photo ${f.path} has been changed or damaged`)
    else files.set(f.path, entry)
  }
  if (problems.length) {
    throw new BackupError(`This backup is incomplete or damaged, so it can’t be restored: ${problems.slice(0, 4).join('; ')}${problems.length > 4 ? ` and ${problems.length - 4} more` : ''}.`)
  }
  return { manifest: m, tables, files }
}

// ---------------------------------------------------------------- restoring

function batches(rows: Row[]): Row[][] {
  const out: Row[][] = []
  let cur: Row[] = []
  let size = 0
  for (const r of rows) {
    const n = JSON.stringify(r).length
    if (cur.length && size + n > ROWS_PIECE) {
      out.push(cur)
      cur = []
      size = 0
    }
    cur.push(r)
    size += n
  }
  if (cur.length || !out.length) out.push(cur)
  return out
}

async function sendFile(t: Transport, token: string, path: string, bytes: Uint8Array, onSent: (n: number) => void) {
  for (let restart = 0; ; restart++) {
    try {
      let offset = 0
      do {
        const piece = bytes.subarray(offset, offset + PIECE)
        const at = offset
        await retry(() => t.post(`restore/file?token=${token}&path=${encodeURIComponent(path)}&offset=${at}&size=${piece.length}`, undefined, { bytes: piece, timeout: 120000 }))
        offset += piece.length
        onSent(piece.length)
      } while (offset < bytes.length)
      return
    } catch (e) {
      // 409: an earlier piece went missing; send the whole file again once.
      if (!(e instanceof ApiError && e.status === 409) || restart >= 1) throw e
    }
  }
}

export class RestoreUnknownError extends Error {
  constructor() {
    super('The connection dropped while the server was putting the backup in place. Wait a minute and reload the page: if the restored records are there, it worked; if not, nothing changed and you can restore again.')
  }
}

export async function restoreBackup(t: Transport, b: Backup, onProgress: OnProgress = () => {}): Promise<RestoreResult> {
  onProgress({ label: 'Starting', done: 0, total: 1 })
  const { token } = await retry(() => t.post<{ token: string }>('restore/start', { manifest: b.manifest }))
  const pieces = Object.entries(b.tables).map(([name, rows]) => [name, batches(rows)] as const)
  const total = sum(pieces.map(([, bs]) => bs.length)) + sum([...b.files.values()].map((f) => Math.max(f.length, 1)))
  let done = 0
  let finishing = false
  try {
    for (const [name, bs] of pieces) {
      for (const [seq, rows] of bs.entries()) {
        onProgress({ label: 'Sending records', done, total })
        await retry(() => t.post(`restore/rows?token=${token}&table=${name}&seq=${seq}`, { rows }, { timeout: 120000 }))
        done++
      }
    }
    let n = 0
    for (const [path, bytes] of b.files) {
      n++
      onProgress({ label: `Sending photos (${n} of ${b.files.size})`, done, total })
      await sendFile(t, token, path, bytes, (k) => {
        done += Math.max(k, 1)
        onProgress({ label: `Sending photos (${n} of ${b.files.size})`, done, total })
      })
    }
    onProgress({ label: 'Putting everything in place', done: total, total })
    finishing = true
    return await t.post<RestoreResult>(`restore/finish?token=${token}`, {}, { timeout: 15 * 60000 })
  } catch (e) {
    // If the server answered, it rolled everything back. If the line dropped while it was
    // finishing, it may still be working, so leave its pieces alone.
    if (finishing && e instanceof OfflineError) throw new RestoreUnknownError()
    await t.post(`restore/cancel?token=${token}`).catch(() => {})
    throw e
  }
}
