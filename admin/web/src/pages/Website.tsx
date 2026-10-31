import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Eye, History, Images, Send, Undo2 } from 'lucide-react'
import { pages, findSection, joinPath } from '@site/content/schema'
import type { Section } from '@site/content/types'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { Badge, Button, Group, IconButton, Loading, Notice, Row, TextArea, cx, useConfirm, useToast } from '@/components/ui'
import { EditorContext, type EditorApi } from '@/components/cms/editor'
import { FieldEditor } from '@/components/cms/Fields'
import { LivePreview, type Device } from '@/components/cms/Preview'
import { ApiError, OfflineError, del, get, post, put } from '@/lib/api'
import { SITE_URL, getAt, same, setAt, toDoc, type SiteContent } from '@/lib/content'
import { dateTime, relative } from '@/lib/format'

interface CmsState {
  draft: unknown | null
  draft_updated_at: string | null
  draft_updated_by: string | null
  published: { id: number; created_at: string; created_by: string | null; note: string | null; data: unknown } | null
  storage_ok: boolean
}
interface Revision { id: number; created_at: string; created_by: string | null; note: string | null; bytes: number }

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error' | 'conflict'

const xl = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)') : null
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      xl?.addEventListener('change', cb)
      return () => xl?.removeEventListener('change', cb)
    },
    () => xl?.matches ?? true,
  )
}

/** Sections whose content differs between two documents. */
function changedSections(a: SiteContent, b: SiteContent) {
  return pages.flatMap((p) => p.sections.filter((s) => Object.keys(s.fields).some((k) => !same(getAt(a, joinPath(s.path, k)), getAt(b, joinPath(s.path, k))))).map((s) => ({ page: p, section: s })))
}

export default function Website() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const wide = useWide()
  const [params, setParams] = useSearchParams()
  const sectionId = params.get('s')
  const section = sectionId ? findSection(sectionId) : null

  const state = useQuery({ queryKey: ['cms'], queryFn: () => get<CmsState>('cms'), staleTime: 0 })

  const [doc, setDoc] = useState<SiteContent | null>(null)
  const [published, setPublished] = useState<SiteContent | null>(null)
  const base = useRef<string | null>(null)
  const edits = useRef(0)
  const [save, setSave] = useState<SaveState>('idle')
  const [conflict, setConflict] = useState<{ message: string } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [history, setHistory] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [device, setDevice] = useState<Device>('desktop')

  // Load once; afterwards, quietly take in a partner's saves when we have nothing unsaved.
  useEffect(() => {
    const s = state.data
    if (!s) return
    const live = toDoc(s.published?.data ?? null)
    if (doc === null) {
      setDoc(toDoc(s.draft ?? s.published?.data ?? null))
      setPublished(live)
      base.current = s.draft_updated_at
      return
    }
    if (s.draft_updated_at !== base.current && (save === 'idle' || save === 'saved')) {
      setDoc(toDoc(s.draft ?? s.published?.data ?? null))
      setPublished(live)
      base.current = s.draft_updated_at
      if (s.draft_updated_by) toast(`Updated with ${s.draft_updated_by}’s latest changes`)
    }
  }, [state.data])

  const set = useCallback((path: string, value: unknown) => {
    setDoc((d) => (d ? setAt(d, path, value) : d))
    edits.current++
    setSave('pending')
  }, [])

  // Autosave the draft a moment after typing stops.
  const saveNow = useCallback(
    async (force = false) => {
      if (!doc) return
      const at = edits.current
      setSave('saving')
      try {
        const r = await put<{ updated_at: string }>('cms/draft', { data: doc, updated_at: base.current, force })
        base.current = r.updated_at
        setConflict(null)
        setSave(edits.current === at ? 'saved' : 'pending')
      } catch (e) {
        if (e instanceof ApiError && e.code === 'conflict') {
          setConflict({ message: e.message })
          setSave('conflict')
        } else {
          setSave('error')
          if (!(e instanceof OfflineError)) toast(e instanceof Error ? e.message : 'Could not save', 'error')
        }
      }
    },
    [doc, toast],
  )
  useEffect(() => {
    if (save !== 'pending') return
    const t = setTimeout(() => saveNow(), 1200)
    return () => clearTimeout(t)
  }, [save, doc, saveNow])
  // Retry after a failed save (e.g. back online).
  useEffect(() => {
    if (save !== 'error') return
    const t = setTimeout(() => saveNow(), 8000)
    return () => clearTimeout(t)
  }, [save, saveNow])

  // Don't lose typing to a closed tab.
  useEffect(() => {
    const busy = save === 'pending' || save === 'saving' || save === 'error' || save === 'conflict'
    if (!busy) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [save])

  const changes = useMemo(() => (doc && published ? changedSections(doc, published) : []), [doc, published])
  const changedIds = useMemo(() => new Set(changes.map((c) => c.section.id)), [changes])
  const api: EditorApi | null = useMemo(() => (doc && published ? { doc, published, set } : null), [doc, published, set])

  const open = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('s', id)
    else next.delete('s')
    setParams(next, { replace: !!sectionId && !!id })
    window.scrollTo(0, 0)
  }

  async function reloadTheirs() {
    const s = await state.refetch()
    if (!s.data) return
    setDoc(toDoc(s.data.draft ?? s.data.published?.data ?? null))
    setPublished(toDoc(s.data.published?.data ?? null))
    base.current = s.data.draft_updated_at
    setConflict(null)
    setSave('idle')
  }

  async function discard() {
    const yes = await confirm({ title: 'Discard all unpublished changes?', body: 'The draft goes back to exactly what is live on the website now.', confirm: 'Discard', destructive: true })
    if (!yes || !published) return
    try {
      const r = await del<{ updated_at: string }>('cms/draft')
      base.current = r.updated_at
      setDoc(published)
      setSave('idle')
      setConflict(null)
      toast('Changes discarded')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not discard', 'error')
    }
  }

  if (state.isLoading || !api || !doc || !published) {
    return (
      <Page title="Website">
        {state.isError ? <Notice tone="red">{state.error.message}</Notice> : <Loading />}
      </Page>
    )
  }

  const status =
    save === 'saving' ? 'Saving draft…'
    : save === 'pending' ? 'Editing…'
    : save === 'error' ? 'Not saved yet. Retrying…'
    : save === 'conflict' ? 'Not saved: someone else edited'
    : changes.length ? `Draft saved · ${changes.length} ${changes.length === 1 ? 'section' : 'sections'} not published`
    : state.data?.published ? `Everything is live · published ${relative(state.data.published.created_at)}`
    : 'Showing the website as built'

  const actions = (
    <>
      <IconButton label="Version history" onClick={() => setHistory(true)}>
        <History className="size-5" />
      </IconButton>
      <IconButton label="Photo library" onClick={() => navigate('/website/photos')}>
        <Images className="size-5" />
      </IconButton>
      {changes.length > 0 && (
        <Button variant="gray" size="sm" icon={<Undo2 className="size-3.5" strokeWidth={2.6} />} onClick={discard} className="hidden sm:inline-flex">
          Discard
        </Button>
      )}
      <Button size="sm" icon={<Send className="size-3.5" strokeWidth={2.6} />} disabled={changes.length === 0 || save === 'conflict'} onClick={() => setPublishing(true)}>
        Publish{changes.length ? ` (${changes.length})` : ''}
      </Button>
    </>
  )

  const notices = (
    <>
      {state.data && !state.data.storage_ok && (
        <div className="mb-4">
          <Notice tone="red">The server can’t write to the dashboard’s “live” folder, so publishing won’t reach the website. See Settings → Website storage.</Notice>
        </div>
      )}
      {conflict && (
        <div className="mb-4">
          <Notice>
            <p>{conflict.message} Your latest edits are still here.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="tinted" onClick={reloadTheirs}>Load their version</Button>
              <Button size="sm" variant="gray" onClick={() => saveNow(true)}>Keep mine</Button>
            </div>
          </Notice>
        </div>
      )}
    </>
  )

  const nav = (
    <SectionNav changed={changedIds} current={section?.id ?? null} onOpen={open} />
  )

  const editor = section && (
    <SectionEditor
      section={section}
      onBack={() => open(null)}
      showBack={!wide}
      onPreview={wide ? undefined : () => setPreviewOpen(true)}
      changed={changedIds.has(section.id)}
      onRevertSection={() => {
        for (const k of Object.keys(section.fields)) {
          const p = joinPath(section.path, k)
          set(p, getAt(published, p))
        }
      }}
    />
  )

  return (
    <EditorContext.Provider value={api}>
      <Page title="Website" subtitle={<span className={cx(save === 'error' || save === 'conflict' ? 'text-orange' : '')}>{status}</span>} actions={actions} wide>
        {notices}
        {wide ? (
          <div className="grid grid-cols-[15rem_minmax(0,1fr)_minmax(24rem,40%)] gap-6">
            <div className="sticky top-16 max-h-[calc(100dvh-5rem)] overflow-y-auto pb-6 no-scrollbar">{nav}</div>
            <div className="min-w-0 pb-10">{editor ?? <Welcome onOpen={open} />}</div>
            <div className="sticky top-16 h-[calc(100dvh-5.5rem)]">
              <LivePreview
                doc={doc}
                path={section?.preview ?? '/'}
                section={section?.id ?? null}
                onSelect={(id) => findSection(id) && open(id)}
                device={device}
                onDevice={setDevice}
                className="h-full"
              />
            </div>
          </div>
        ) : section ? (
          editor
        ) : (
          <>
            <Button variant="tinted" size="lg" className="mb-6 w-full" icon={<Eye className="size-5" />} onClick={() => setPreviewOpen(true)}>
              Preview the website
            </Button>
            {nav}
          </>
        )}
      </Page>

      {!wide && (
        <Sheet open={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview" wide>
          <div className="h-[min(75dvh,52rem)] pt-1">
            <LivePreview
              doc={doc}
              path={section?.preview ?? '/'}
              section={section?.id ?? null}
              onSelect={(id) => {
                if (!findSection(id)) return
                setPreviewOpen(false)
                open(id)
              }}
              device={device === 'desktop' && window.innerWidth < 700 ? 'phone' : device}
              onDevice={setDevice}
              className="h-full"
            />
          </div>
        </Sheet>
      )}

      <PublishSheet
        open={publishing}
        onClose={() => setPublishing(false)}
        changes={changes}
        onPublish={async (note) => {
          try {
            const r = await post<{ revision: number; updated_at: string }>('cms/publish', { data: doc, updated_at: base.current, note })
            base.current = r.updated_at
            setPublished(doc)
            setSave('idle')
            setPublishing(false)
            await qc.invalidateQueries({ queryKey: ['cms'] })
            toast('Published. It’s live on the website now.')
          } catch (e) {
            if (e instanceof ApiError && e.code === 'conflict') {
              setPublishing(false)
              setConflict({ message: e.message })
              setSave('conflict')
            } else {
              throw e
            }
          }
        }}
      />
      <HistorySheet
        open={history}
        onClose={() => setHistory(false)}
        currentId={state.data?.published?.id ?? null}
        onRestore={(data) => {
          setDoc(toDoc(data))
          edits.current++
          setSave('pending')
          setHistory(false)
          toast('Loaded into your draft. Check it, then publish.')
        }}
      />
    </EditorContext.Provider>
  )
}

// ---------------------------------------------------------------- navigation

function SectionNav({ changed, current, onOpen }: { changed: Set<string>; current: string | null; onOpen: (id: string) => void }) {
  return (
    <nav aria-label="Website sections">
      {pages.map((p) => (
        <Group key={p.id} title={p.label} className="mb-5">
          {p.sections.map((s) => (
            <Row
              key={s.id}
              onClick={() => onOpen(s.id)}
              title={<span className={cx(current === s.id && 'font-semibold text-accent')}>{s.label}</span>}
              trailing={changed.has(s.id) ? <span className="inline-block size-2 rounded-full bg-orange" aria-label="Edited" title="Edited, not published" /> : undefined}
              className={cx(current === s.id && 'bg-accent-soft')}
            />
          ))}
        </Group>
      ))}
    </nav>
  )
}

function Welcome({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-card">
      <h2 className="text-[1.25rem] font-semibold">Edit the website</h2>
      <p className="mt-2 max-w-prose text-[0.9375rem] text-label-2">
        Choose a section on the left, or hover the preview and press <b>Edit</b>. Changes save as a draft automatically and
        only appear on the website when you press <b>Publish</b>. Everyone with a login shares one draft.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {['home.hero', 'products.0', 'products.1', 'site.contact', 'faq'].map((id) => (
          <Button key={id} variant="tinted" size="sm" onClick={() => onOpen(id)}>
            {findSection(id)?.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function SectionEditor({ section, onBack, showBack, onPreview, changed, onRevertSection }: { section: Section; onBack: () => void; showBack: boolean; onPreview?: () => void; changed: boolean; onRevertSection: () => void }) {
  const page = pages.find((p) => p.sections.includes(section))!
  const confirm = useConfirm()
  return (
    <div>
      {showBack && (
        <button type="button" onClick={onBack} className="pressable -ml-1 mb-3 inline-flex items-center gap-0.5 text-[1rem] text-accent">
          <ChevronLeft className="size-5" strokeWidth={2.4} /> All sections
        </button>
      )}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-medium uppercase tracking-[0.04em] text-label-2">{page.label}</p>
          <h2 className="display mt-0.5 flex items-center gap-2 text-[1.625rem] font-bold">
            {section.label} {changed && <Badge tone="orange">Edited</Badge>}
          </h2>
          {section.hint && <p className="mt-1 max-w-prose text-[0.9375rem] text-label-2">{section.hint}</p>}
        </div>
        <div className="flex gap-2">
          {onPreview && (
            <Button size="sm" variant="tinted" icon={<Eye className="size-3.5" />} onClick={onPreview}>
              Preview
            </Button>
          )}
          {changed && (
            <Button
              size="sm"
              variant="gray"
              icon={<Undo2 className="size-3.5" />}
              onClick={async () => (await confirm({ title: `Undo all changes to ${section.label}?`, body: 'This section goes back to what is live on the website.', confirm: 'Undo changes' })) && onRevertSection()}
            >
              Undo section
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-6 rounded-2xl bg-surface p-4 shadow-card sm:p-6">
        {Object.entries(section.fields).map(([k, f]) => (
          <FieldEditor key={`${section.id}:${k}`} field={f} path={joinPath(section.path, k)} />
        ))}
      </div>
      <NextSection section={section} />
    </div>
  )
}

function NextSection({ section }: { section: Section }) {
  const [params, setParams] = useSearchParams()
  const all = pages.flatMap((p) => p.sections)
  const i = all.findIndex((s) => s.id === section.id)
  const next = all[i + 1]
  if (!next) return null
  return (
    <button
      type="button"
      onClick={() => {
        const q = new URLSearchParams(params)
        q.set('s', next.id)
        setParams(q)
        window.scrollTo(0, 0)
      }}
      className="pressable mt-4 flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-3.5 text-left shadow-card"
    >
      <span>
        <span className="block text-[0.75rem] text-label-2">Next</span>
        <span className="text-[0.9375rem] font-medium">{next.label}</span>
      </span>
      <ChevronRight className="size-5 text-label-3" />
    </button>
  )
}

// ---------------------------------------------------------------- publish

function PublishSheet({ open, onClose, changes, onPublish }: { open: boolean; onClose: () => void; changes: ReturnType<typeof changedSections>; onPublish: (note: string) => Promise<void> }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const byPage = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const c of changes) m.set(c.page.label, [...(m.get(c.page.label) ?? []), c.section.label])
    return [...m.entries()]
  }, [changes])

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Publish changes"
      submitLabel="Publish"
      busy={busy}
      onSubmit={async () => {
        setBusy(true)
        setError(null)
        try {
          await onPublish(note.trim())
          setNote('')
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Publishing failed.')
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className="space-y-5 pt-1">
        {error && <Notice tone="red">{error}</Notice>}
        <p className="px-1 text-[0.9375rem] text-label-2">These go live on {SITE_URL.replace(/^https?:\/\//, '')} straight away. You can always go back to an earlier version from History.</p>
        <Group title="What’s changing">
          {byPage.map(([pageLabel, list]) => (
            <Row key={pageLabel} title={pageLabel} subtitle={list.join(' · ')} />
          ))}
        </Group>
        <label className="block">
          <span className="mb-1.5 block px-1 text-[0.8125rem] font-medium text-label-2">Note for the history (optional)</span>
          <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. New Diwali prices" maxLength={255} />
        </label>
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------- history

function HistorySheet({ open, onClose, currentId, onRestore }: { open: boolean; onClose: () => void; currentId: number | null; onRestore: (data: unknown) => void }) {
  const confirm = useConfirm()
  const toast = useToast()
  const { data, isLoading } = useQuery({ queryKey: ['cms', 'revisions'], queryFn: () => get<Revision[]>('cms/revisions'), enabled: open })
  const [busy, setBusy] = useState<number | null>(null)

  async function restore(r: Revision) {
    const yes = await confirm({
      title: 'Load this version into the draft?',
      body: `The version from ${dateTime(r.created_at)} replaces your current draft. Nothing changes on the website until you publish.`,
      confirm: 'Load version',
    })
    if (!yes) return
    setBusy(r.id)
    try {
      const full = await get<{ data: unknown }>(`cms/revisions/${r.id}`)
      onRestore(full.data)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load that version', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Version history">
      <div className="pt-1">
        <p className="mb-4 px-1 text-[0.875rem] text-label-2">Every publish is kept. Load an older version to bring it back, then publish it.</p>
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <p className="py-10 text-center text-[0.9375rem] text-label-2">Nothing published from the dashboard yet. The website is showing its built-in content.</p>
        ) : (
          <Group>
            {data.map((r) => (
              <Row
                key={r.id}
                title={
                  <span className="flex items-center gap-2">
                    {r.note || 'Website update'}
                    {r.id === currentId && <Badge tone="green">Live</Badge>}
                  </span>
                }
                subtitle={`${dateTime(r.created_at)}${r.created_by ? ` · ${r.created_by}` : ''}`}
                trailing={
                  r.id !== currentId ? (
                    <Button size="sm" variant="tinted" disabled={busy !== null} onClick={() => restore(r)}>
                      {busy === r.id ? 'Loading…' : 'Load'}
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </Group>
        )}
      </div>
    </Sheet>
  )
}
