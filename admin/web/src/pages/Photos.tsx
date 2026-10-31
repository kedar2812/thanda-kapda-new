import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Copy, Images } from 'lucide-react'
import { joinPath, sections } from '@site/content/schema'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { matches } from '@/components/common'
import { Button, Empty, Field, Group, Loading, Notice, Row, SearchField, TextInput, useConfirm, useToast } from '@/components/ui'
import { UploadZone, useMedia } from '@/components/cms/MediaPicker'
import { ApiError, del, get, put } from '@/lib/api'
import { bytes, type MediaItem } from '@/lib/images'
import { date } from '@/lib/format'
import { useNames } from '@/lib/data'

/** "products.1.gallery.2" → the editor section whose field holds it, for the "Used on" list. */
function placeLabel(path: string) {
  for (const s of sections) {
    for (const k of Object.keys(s.fields)) {
      const f = joinPath(s.path, k)
      if (path === f || path.startsWith(`${f}.`)) return { id: s.id, label: s.label }
    }
  }
  return { id: '', label: path }
}

export default function Photos() {
  const navigate = useNavigate()
  const { data, isLoading } = useMedia()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<MediaItem | null>(null)
  const shown = useMemo(() => (data ?? []).filter((m) => matches(q, m.name, m.alt)), [data, q])
  const total = (data ?? []).reduce((a, m) => a + m.bytes, 0)

  return (
    <Page
      title="Photos"
      subtitle={data?.length ? `${data.length} uploaded · ${bytes(total)} in total` : 'Photos you upload for the website'}
      back={
        <button type="button" onClick={() => navigate('/website')} className="pressable inline-flex items-center text-[1rem] text-accent">
          <ChevronLeft className="size-5" strokeWidth={2.4} /> Website
        </button>
      }
      toolbar={<div className="md:w-80"><SearchField value={q} onChange={setQ} placeholder="Search by name or description" /></div>}
    >
      <div className="mb-6">
        <UploadZone multiple onUploaded={() => {}} />
      </div>
      {isLoading ? (
        <Loading />
      ) : !shown.length ? (
        <Empty icon={<Images className="size-7" />} title={data?.length ? 'No photos match' : 'No photos yet'} body={data?.length ? 'Try another search.' : 'Upload photos here, or straight from any photo field in the website editor.'} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((m) => (
            <button key={m.id} type="button" onClick={() => setOpen(m)} className="pressable group text-left">
              <span className="block aspect-[4/3] overflow-hidden rounded-xl bg-fill shadow-card">
                <img src={m.thumb} alt={m.alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </span>
              <span className="mt-1.5 block truncate px-0.5 text-[0.875rem]">{m.name}</span>
              <span className="block px-0.5 text-[0.75rem] text-label-2">
                {m.width}×{m.height} · {bytes(m.bytes)}
              </span>
            </button>
          ))}
        </div>
      )}
      <PhotoSheet item={open} onClose={() => setOpen(null)} />
    </Page>
  )
}

function PhotoSheet({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  const [last, setLast] = useState(item)
  if (item && item !== last) setLast(item)
  const m = item ?? last
  return <Sheet open={item !== null} onClose={onClose} title="Photo" wide>{m && <PhotoDetail key={m.id} item={m} onClose={onClose} />}</Sheet>
}

function PhotoDetail({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const names = useNames()
  const detail = useQuery({ queryKey: ['media', item.id], queryFn: () => get<MediaItem>(`media/${item.id}`) })
  const [name, setName] = useState(item.name)
  const [alt, setAlt] = useState(item.alt)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const used = detail.data?.used_in ?? []

  async function saveMeta() {
    setBusy(true)
    try {
      await put(`media/${item.id}`, { name, alt })
      await qc.invalidateQueries({ queryKey: ['list', 'media'] })
      toast('Saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    const yes = await confirm({ title: 'Delete this photo?', body: 'It is removed from the server for good.', confirm: 'Delete', destructive: true })
    if (!yes) return
    try {
      await del(`media/${item.id}`)
      await qc.invalidateQueries({ queryKey: ['list', 'media'] })
      toast('Photo deleted')
      onClose()
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'in_use' ? 'This photo is still used on the website (see below). Replace it there first.' : e instanceof Error ? e.message : 'Could not delete')
    }
  }

  return (
    <div className="grid gap-6 pt-1 md:grid-cols-[1.2fr_1fr]">
      <div>
        <img src={item.url} alt={item.alt} className="w-full rounded-xl bg-fill" />
        <p className="mt-2 px-1 text-[0.8125rem] text-label-2">
          {item.width}×{item.height} · {item.widths.length} sizes for different screens · {bytes(item.bytes)} · uploaded {date(item.created_at)}
          {item.created_by ? ` by ${names.user(item.created_by)}` : ''}
        </p>
      </div>
      <div className="space-y-5">
        {error && <Notice tone="red">{error}</Notice>}
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Description" hint="Suggested description when this photo is placed. Each place on the website keeps its own.">
          <TextInput value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="What’s in the photo?" />
        </Field>
        <Button onClick={saveMeta} disabled={busy || (name === item.name && alt === item.alt)}>
          Save
        </Button>
        <Group title="Used on the website" footer={used.length ? 'Includes unpublished changes.' : undefined}>
          {detail.isLoading ? (
            <Row title="Checking…" tone="muted" />
          ) : used.length === 0 ? (
            <Row title="Not used anywhere" tone="muted" />
          ) : (
            used.map((p) => {
              const place = placeLabel(p)
              return <Row key={p} title={place.label} subtitle={p} onClick={place.id ? () => navigate(`/website?s=${encodeURIComponent(place.id)}`) : undefined} />
            })
          )}
        </Group>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="gray"
            icon={<Copy className="size-4" />}
            onClick={() => navigator.clipboard?.writeText(item.url).then(() => toast('Link copied'), () => toast('Could not copy', 'error'))}
          >
            Copy link
          </Button>
          <Button variant="destructive" onClick={remove} disabled={used.length > 0}>
            Delete photo
          </Button>
        </div>
      </div>
    </div>
  )
}
