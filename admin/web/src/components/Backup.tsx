import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { Sheet } from '@/components/Sheet'
import { downloadBlob } from '@/components/common'
import { Button, Group, Notice, Row, useToast } from '@/components/ui'
import { get, getBytes, post } from '@/lib/api'
import { BackupError, createBackup, readBackup, restoreBackup, summary, type Backup, type Progress, type RestoreResult, type Transport } from '@/lib/backup'
import { dateTime, qty } from '@/lib/format'

const transport: Transport = { get, getBytes, post }

type State =
  | { step: 'idle' }
  | { step: 'working'; title: string; progress: Progress }
  | { step: 'confirm'; backup: Backup; fileName: string }
  | { step: 'done'; result: RestoreResult }
  | { step: 'failed'; title: string; message: string }

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.')

function size(bytes: number) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/**
 * Download a full backup, or restore one. Returns the two actions and the
 * sheet that shows progress; put `sheet` anywhere on the page.
 */
export function useBackupTools() {
  const qc = useQueryClient()
  const toast = useToast()
  const [state, setState] = useState<State>({ step: 'idle' })
  const [saveFirst, setSaveFirst] = useState(true)
  const input = useRef<HTMLInputElement>(null)
  const busy = state.step === 'working'

  // Closing the tab halfway would waste the work (a restore is safe either way: nothing changes until the end).
  useEffect(() => {
    if (!busy) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busy])

  const working = (title: string) => (progress: Progress) => setState({ step: 'working', title, progress })

  /** `keepOpen`: another step follows, so leave the progress sheet up. */
  async function download(keepOpen = false): Promise<boolean> {
    const onProgress = working(keepOpen ? 'Saving a copy of what’s here' : 'Making a backup')
    try {
      const b = await createBackup(transport, onProgress)
      downloadBlob(b.blob, b.filename)
      if (!keepOpen) setState({ step: 'idle' })
      toast(`Backup downloaded: ${qty(b.records)} records, ${qty(b.files)} photo files (${size(b.blob.size)})`)
      if (b.skipped.length) toast(`${b.skipped.length} file(s) in the photo folder aren’t photos and were left out`, 'error')
      return true
    } catch (e) {
      setState({ step: 'failed', title: 'Backup not made', message: message(e) })
      return false
    }
  }

  async function open(file: File) {
    working('Checking the backup')({ label: 'Opening the backup', done: 0, total: 1 })
    try {
      const backup = await readBackup(file, working('Checking the backup'))
      setSaveFirst(true)
      setState({ step: 'confirm', backup, fileName: file.name })
    } catch (e) {
      setState({ step: 'failed', title: 'Can’t use this file', message: e instanceof BackupError ? e.message : `This file couldn’t be read. ${message(e)}` })
    }
  }

  async function restore(backup: Backup) {
    if (saveFirst && !(await download(true))) return
    try {
      const result = await restoreBackup(transport, backup, working('Restoring'))
      setState({ step: 'done', result })
      // Refresh in place: clearing the cache would briefly unmount the app (and this sheet).
      await qc.invalidateQueries()
    } catch (e) {
      setState({ step: 'failed', title: 'Nothing was changed', message: message(e) })
    }
  }

  const close = () => !busy && setState({ step: 'idle' })

  let body: ReactNode = null
  let title = ''
  let submit: (() => void) | undefined
  if (state.step === 'working') {
    title = state.title
    const pct = state.progress.total > 0 ? Math.min(100, Math.round((state.progress.done / state.progress.total) * 100)) : 0
    body = (
      <div className="space-y-4 py-6">
        <div className="text-[0.9375rem] font-medium" aria-live="polite">{state.progress.label}…</div>
        <div className="h-2 overflow-hidden rounded-full bg-fill" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[0.8125rem] text-label-2">Keep this page open until it finishes.</p>
      </div>
    )
  } else if (state.step === 'confirm') {
    const s = summary(state.backup)
    title = 'Restore this backup?'
    submit = () => restore(state.backup)
    body = (
      <div className="space-y-5 pt-1">
        <Notice tone="red">
          {s.partial
            ? 'This replaces the records in this older backup file (sales, money, stock, GST, to-dos and the website’s words). Photos, logins and history stay as they are.'
            : 'Everything in the dashboard and on the website is replaced with this backup: records, money, stock, the website’s words and photos, logins and history. What’s here now is gone unless you keep a copy.'}
        </Notice>
        <Group title={state.fileName}>
          <Row title="Made" trailing={s.createdAt ? dateTime(s.createdAt) : 'Unknown'} />
          {s.business && <Row title="Business" trailing={s.business} />}
          <Row title="Records" trailing={qty(s.records)} />
          {!s.partial && <Row title="Photo files" trailing={`${qty(s.photos)} · ${size(s.photoBytes)}`} />}
          {s.logins !== null && <Row title="Logins" trailing={qty(s.logins)} />}
          {s.websiteVersions !== null && <Row title="Published website versions" trailing={qty(s.websiteVersions)} />}
        </Group>
        <label className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3 shadow-card">
          <input type="checkbox" className="mt-1 size-4 accent-[var(--color-accent)]" checked={saveFirst} onChange={(e) => setSaveFirst(e.target.checked)} />
          <span>
            <span className="block text-[0.9375rem]">First download a backup of what’s here now</span>
            <span className="block text-[0.8125rem] text-label-2">So you can go back if this was the wrong file.</span>
          </span>
        </label>
        <p className="text-[0.8125rem] text-label-2">Every part of the file has been checked. Nothing changes until all of it has reached the server; if anything goes wrong on the way, nothing changes at all. You stay signed in.</p>
      </div>
    )
  } else if (state.step === 'done') {
    title = 'Backup restored'
    body = (
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-8 shrink-0 text-green" />
          <div className="text-[0.9375rem]">
            {qty(Object.values(state.result.restored).reduce((a, b) => a + b, 0))} records and {qty(state.result.files)} photo files restored. The website shows the restored version now.
          </div>
        </div>
        {state.result.notes.map((n) => <Notice key={n} tone="accent">{n}</Notice>)}
        <Button size="lg" className="w-full" onClick={close}>Done</Button>
      </div>
    )
  } else if (state.step === 'failed') {
    title = state.title
    body = (
      <div className="space-y-4 pt-2">
        <Notice tone="red">{state.message}</Notice>
        <Button size="lg" variant="tinted" className="w-full" onClick={close}>Close</Button>
      </div>
    )
  }

  const sheet = (
    <>
      <input
        ref={input}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed,.json,application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) open(f)
        }}
      />
      <Sheet open={state.step !== 'idle'} onClose={close} title={title} onSubmit={submit} submitLabel="Restore" busy={busy}>
        {body}
      </Sheet>
    </>
  )

  return { download: () => download(), chooseFile: () => input.current?.click(), busy, sheet }
}
