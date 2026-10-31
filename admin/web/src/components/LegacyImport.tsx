import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CircleCheck, CircleAlert, FileUp, Info } from 'lucide-react'
import { Sheet } from './Sheet'
import { downloadBlob } from './common'
import { Button, Group, Notice, Row, useConfirm, useToast } from './ui'
import { ApiError, get, post } from '@/lib/api'
import { money, plural, qty, todayISO } from '@/lib/format'
import type { LegacyFigure, LegacyResult } from '@/lib/types'

const OLD_DASHBOARD_URL = 'https://thanda-kapda.netlify.app'

const COUNT_LABELS: [string, string, string][] = [
  ['sales', 'sale', 'sales'],
  ['expenses', 'expense', 'expenses'],
  ['amazon_orders', 'Amazon order', 'Amazon orders'],
  ['samples', 'sample', 'samples'],
  ['gst_purchases', 'GST purchase', 'GST purchases'],
  ['gst_sales', 'GST sales line', 'GST sales lines'],
  ['adjustments', 'balance adjustment', 'balance adjustments'],
  ['todos', 'task', 'tasks'],
  ['history', 'history entry', 'history entries'],
]

const show = (f: LegacyFigure, n: number) => (f.kind === 'money' ? money(n) : `${qty(n)} pcs`)

/**
 * Brings everything over from the old Netlify dashboard: preview first (the
 * server does the whole import and rolls it back), then the real thing.
 */
export function LegacyImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState('')
  const [data, setData] = useState<unknown>(null)
  const [preview, setPreview] = useState<LegacyResult | null>(null)
  const [done, setDone] = useState<LegacyResult | null>(null)
  const [busy, setBusy] = useState<'reading' | 'importing' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setFile(''); setData(null); setPreview(null); setDone(null); setError(null) }
  const close = () => { if (!busy) { reset(); onClose() } }

  async function read(f: File) {
    reset()
    setFile(f.name)
    let json: unknown
    try {
      json = JSON.parse(await f.text())
    } catch {
      return setError('That file isn’t a backup — it should be the .json file the old dashboard’s “Export backup” button downloads.')
    }
    setBusy('reading')
    try {
      setPreview(await post<LegacyResult>('legacy/import', { data: json, dry_run: true }))
      setData(json)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not read that file. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function run() {
    const yes = await confirm({
      title: 'Replace the data here?',
      body: 'Everything in Sales, Stock, Money, Expenses, Amazon, Samples, GST and To-do will be replaced with the old dashboard’s data. Logins, the website and visitor stats stay. A backup of what’s here now downloads first.',
      confirm: 'Bring it over',
      destructive: true,
    })
    if (!yes) return
    setBusy('importing')
    setError(null)
    try {
      const backup = await get('backup')
      downloadBlob(new Blob([JSON.stringify(backup, null, 1)], { type: 'application/json' }), `thanda-kapda-backup-before-import-${todayISO()}.json`)
      const res = await post<LegacyResult>('legacy/import', { data })
      await qc.invalidateQueries()
      setDone(res)
      toast('Everything is here')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'The import didn’t finish. Nothing was changed — please try again.')
    } finally {
      setBusy(null)
    }
  }

  const result = done ?? preview
  const mismatches = result?.figures.filter((f) => !f.match && !f.explain) ?? []

  return (
    <Sheet open={open} onClose={close} title="Move from the old dashboard" wide>
      <div className="space-y-5 pt-1">
        {error && <Notice tone="red">{error}</Notice>}

        {done ? (
          <Notice tone="accent">
            Done. {summary(done.counts)} are now in this dashboard, and the figures below match the old one. A backup of the data that was here before was downloaded.
          </Notice>
        ) : (
          <>
            <ol className="list-decimal space-y-1.5 pl-5 text-[0.9375rem] text-label-2">
              <li>
                Open the old dashboard at{' '}
                <a href={OLD_DASHBOARD_URL} target="_blank" rel="noreferrer" className="font-medium text-accent">thanda-kapda.netlify.app</a> and sign in.
              </li>
              <li>Go to <b className="text-label">Settings</b> and press <b className="text-label">Export backup</b>. A .json file downloads.</li>
              <li>Choose that file here. You’ll see a preview first — nothing changes until you confirm.</li>
            </ol>
            <input ref={input} type="file" accept="application/json,.json" hidden onChange={(e) => { if (e.target.files?.[0]) read(e.target.files[0]); e.target.value = '' }} />
            <Button variant="tinted" size="lg" className="w-full" icon={<FileUp className="size-5" />} onClick={() => input.current?.click()} disabled={!!busy}>
              {busy === 'reading' ? 'Reading…' : file || 'Choose the backup file'}
            </Button>
          </>
        )}

        {result && (
          <>
            {!done && <Notice tone="accent">Ready to bring over {summary(result.counts)}.</Notice>}

            <Group title={done ? 'Checked against the old dashboard' : 'Old dashboard vs. here, after the move'} footer="Worked out with the old dashboard’s own formulas.">
              {result.figures.map((f) => (
                <Row
                  key={f.key}
                  leading={
                    f.match ? <CircleCheck className="size-5 text-green" /> : f.explain ? <Info className="size-5 text-orange" /> : <CircleAlert className="size-5 text-red" />
                  }
                  title={f.label}
                  subtitle={f.match ? undefined : f.explain ?? `Old dashboard showed ${show(f, f.old)}.`}
                  trailing={<span className="num">{show(f, f.new)}</span>}
                  trailingSub={f.match ? 'Same' : `was ${show(f, f.old)}`}
                  chevron={false}
                  wrap
                />
              ))}
            </Group>
            {mismatches.length > 0 && (
              <Notice tone="red">{plural(mismatches.length, 'figure')} won’t match. Check the notes below, or send this file to whoever set up the dashboard before going ahead.</Notice>
            )}

            {result.notes.length > 0 && (
              <Group title="Good to know" footer="Small fixes made so every record fits. Nothing was thrown away.">
                {result.notes.map((n, i) => (
                  <Row key={i} title={<span className="text-[0.875rem]">{n.text}</span>} subtitle={n.area} chevron={false} wrap />
                ))}
              </Group>
            )}
            {result.skipped.length > 0 && (
              <Group title={`Couldn’t bring over (${result.skipped.length})`}>
                {result.skipped.map((s, i) => <Row key={i} title={<span className="text-[0.875rem]">{s}</span>} tone="muted" chevron={false} wrap />)}
              </Group>
            )}

            {done ? (
              <Button size="lg" className="w-full" onClick={close}>Done</Button>
            ) : (
              <div className="space-y-2">
                <Button size="lg" className="w-full" onClick={run} disabled={!!busy}>
                  {busy === 'importing' ? 'Bringing it over…' : 'Bring it all over'}
                </Button>
                <p className="px-1 text-center text-[0.8125rem] text-label-2">Replaces the business data here. Logins, website and visitor stats stay.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}

function summary(counts: Record<string, number>) {
  const parts = COUNT_LABELS.filter(([k]) => counts[k]).map(([k, one, many]) => plural(counts[k], one, many))
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : (parts[0] ?? 'nothing')
}
