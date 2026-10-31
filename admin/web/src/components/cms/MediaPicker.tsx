import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ImageUp } from 'lucide-react'
import { get } from '@/lib/api'
import { builtInPhotos, imageUrl, type CmsImage } from '@/lib/content'
import { preparePhoto, uploadPhoto, type MediaItem } from '@/lib/images'
import { Notice, Segmented, cx, useToast } from '@/components/ui'
import { Sheet } from '@/components/Sheet'

export function useMedia() {
  return useQuery({ queryKey: ['list', 'media'], queryFn: () => get<MediaItem[]>('media') })
}

export const mediaToImage = (m: MediaItem): CmsImage => ({ src: m.src, alt: m.alt, width: m.width, height: m.height, focus: '50% 50%', zoom: 1 })

/** Drop zone + file button that prepares and uploads photos, reporting progress. */
export function UploadZone({ onUploaded, multiple = false, compact = false }: { onUploaded: (m: MediaItem) => void; multiple?: boolean; compact?: boolean }) {
  const qc = useQueryClient()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [job, setJob] = useState<{ name: string; stage: 'preparing' | 'uploading'; progress: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(files: FileList | File[]) {
    setError(null)
    for (const file of Array.from(files)) {
      try {
        setJob({ name: file.name, stage: 'preparing', progress: 0 })
        const prepared = await preparePhoto(file)
        setJob({ name: file.name, stage: 'uploading', progress: 0 })
        const item = await uploadPhoto(prepared, file.name, '', (p) => setJob((j) => (j ? { ...j, progress: p } : j)))
        await qc.invalidateQueries({ queryKey: ['list', 'media'] })
        onUploaded(item)
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : 'upload failed'}`)
        toast('Upload failed', 'error')
      }
    }
    setJob(null)
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) run(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={!!job}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          if (e.dataTransfer.files.length) run(multiple ? e.dataTransfer.files : [e.dataTransfer.files[0]])
        }}
        className={cx(
          'flex w-full items-center gap-3 rounded-2xl border-2 border-dashed px-4 text-left transition-colors',
          compact ? 'py-3' : 'py-5',
          drag ? 'border-accent bg-accent-soft' : 'border-fill-strong hover:border-accent/50 hover:bg-fill/50',
        )}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <ImageUp className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          {job ? (
            <>
              <span className="block truncate text-[0.9375rem] font-medium">{job.stage === 'preparing' ? 'Preparing' : 'Uploading'} {job.name}…</span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-fill">
                <span className="block h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${job.stage === 'preparing' ? 8 : Math.max(8, job.progress * 100)}%` }} />
              </span>
            </>
          ) : (
            <>
              <span className="block text-[0.9375rem] font-semibold text-accent">Upload {multiple ? 'photos' : 'a photo'}</span>
              <span className="block text-[0.8125rem] text-label-2">Or drop {multiple ? 'them' : 'it'} here. Phone photos are fine; they’re resized and compressed for you.</span>
            </>
          )}
        </span>
      </button>
      {error && (
        <div className="mt-2">
          <Notice tone="red">{error}</Notice>
        </div>
      )}
    </div>
  )
}

/** Chooses a photo for a field: from uploads, the built-in photos, or a new upload. */
export function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (img: CmsImage) => void }) {
  const [tab, setTab] = useState<'library' | 'builtin'>('library')
  const { data, isLoading } = useMedia()

  return (
    <Sheet open={open} onClose={onClose} title="Choose a photo" wide>
      <div className="space-y-4 pt-1">
        <UploadZone onUploaded={(m) => onPick(mediaToImage(m))} />
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'library', label: `Your uploads${data?.length ? ` (${data.length})` : ''}` },
            { value: 'builtin', label: 'Built-in photos' },
          ]}
        />
        {tab === 'library' ? (
          isLoading ? (
            <p className="py-10 text-center text-[0.9375rem] text-label-2">Loading…</p>
          ) : !data?.length ? (
            <p className="py-10 text-center text-[0.9375rem] text-label-2">No uploads yet. Upload one above, or use a built-in photo.</p>
          ) : (
            <Grid items={data.map((m) => ({ key: String(m.id), label: m.name, thumb: m.thumb, onPick: () => onPick(mediaToImage(m)) }))} />
          )
        ) : (
          <Grid items={builtInPhotos.map((p) => ({ key: p.image.src, label: p.label, thumb: imageUrl(p.image.src, 640), onPick: () => onPick(p.image) }))} />
        )}
      </div>
    </Sheet>
  )
}

function Grid({ items }: { items: { key: string; label: string; thumb: string; onPick: () => void }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <button key={it.key} type="button" onClick={it.onPick} className="pressable group text-left">
          <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-fill">
            <img src={it.thumb} alt="" loading="lazy" className="size-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
              <span className="grid size-9 place-items-center rounded-full bg-white text-accent shadow">
                <Check className="size-5" strokeWidth={3} />
              </span>
            </span>
          </span>
          <span className="mt-1.5 block truncate px-0.5 text-[0.8125rem] text-label-2">{it.label}</span>
        </button>
      ))}
    </div>
  )
}
