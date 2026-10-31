import { useRef, useState } from 'react'
import { Crop, ImageOff, ImagePlus } from 'lucide-react'
import type { CmsImage, ImageField } from '@site/content/types'
import { cropStyle, imageUrl } from '@/lib/content'
import { Button, Segmented, cx } from '@/components/ui'
import { Sheet } from '@/components/Sheet'
import { FieldLabel } from './Fields'
import { useField } from './editor'
import { MediaPicker } from './MediaPicker'

/** "4 / 5" → 0.8 */
function ratio(aspect?: string) {
  const [w, h] = (aspect ?? '4 / 3').split('/').map((x) => Number(x.trim()))
  return w > 0 && h > 0 ? w / h : 4 / 3
}

/** The image as the website will crop it. */
export function Framed({ image, aspect, className, width = 640 }: { image: CmsImage; aspect?: string; className?: string; width?: number }) {
  return (
    <div className={cx('relative overflow-hidden rounded-xl bg-fill', className)} style={{ aspectRatio: String(ratio(aspect)) }}>
      {image.src ? (
        <img src={imageUrl(image.src, width)} alt="" className="absolute inset-0 size-full object-cover" style={cropStyle(image)} loading="lazy" draggable={false} />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-label-3">
          <ImageOff className="size-7" />
        </div>
      )}
    </div>
  )
}

export function ImageEditor({ field, path, compact }: { field: ImageField; path: string; compact?: boolean }) {
  const f = useField<CmsImage>(path)
  const img = f.value
  const [picking, setPicking] = useState(false)
  const [cropping, setCropping] = useState(false)
  const id = `f-${path.replace(/\./g, '-')}-alt`

  return (
    <div>
      {field.label && <FieldLabel label={field.label} changed={f.changed} onRevert={f.revert} />}
      <div className={cx('flex gap-3', compact ? 'flex-col' : 'flex-col sm:flex-row')}>
        <button type="button" onClick={() => setPicking(true)} className={cx('pressable shrink-0 text-left', compact ? 'w-full' : 'w-full sm:w-44')} aria-label="Change photo">
          <Framed image={img} aspect={field.aspect} />
        </button>
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="tinted" icon={<ImagePlus className="size-3.5" strokeWidth={2.4} />} onClick={() => setPicking(true)}>
              {img.src ? 'Change' : 'Choose photo'}
            </Button>
            {img.src && (
              <Button size="sm" variant="gray" icon={<Crop className="size-3.5" strokeWidth={2.4} />} onClick={() => setCropping(true)}>
                Crop
              </Button>
            )}
          </div>
          <div>
            <label htmlFor={id} className="mb-1 block px-1 text-[0.75rem] font-medium text-label-2">
              Description for screen readers and Google
            </label>
            <input
              id={id}
              value={img.alt}
              onChange={(e) => f.set({ ...img, alt: e.target.value })}
              placeholder="What’s in the photo? Leave blank if it’s decorative."
              className="block h-10 w-full rounded-xl bg-surface-2 px-3 text-[0.875rem] outline-none placeholder:text-label-3 focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
            />
          </div>
          {field.hint && <p className="px-1 text-[0.8125rem] text-label-2">{field.hint}</p>}
        </div>
      </div>

      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(picked) => {
          // A new photo starts centred; keep the description unless the library has one.
          f.set({ ...picked, alt: picked.alt || img.alt, focus: '50% 50%', zoom: 1 })
          setPicking(false)
        }}
      />
      <CropSheet open={cropping} onClose={() => setCropping(false)} image={img} aspect={field.aspect} onSave={(v) => f.set(v)} />
    </div>
  )
}

function parseFocus(focus: string): [number, number] {
  const m = focus.match(/^([\d.]+)% ([\d.]+)%$/)
  return m ? [Number(m[1]), Number(m[2])] : [50, 50]
}

/** Drag the focus point to choose what stays in frame; zoom closes in on it. */
function CropSheet({ open, onClose, image, aspect, onSave }: { open: boolean; onClose: () => void; image: CmsImage; aspect?: string; onSave: (v: CmsImage) => void }) {
  const [draft, setDraft] = useState(image)
  const [view, setView] = useState<'site' | 'phone'>('site')
  const box = useRef<HTMLDivElement>(null)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft(image)
  }
  const [fx, fy] = parseFocus(draft.focus)

  const place = (clientX: number, clientY: number) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    const x = Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
    const y = Math.round(Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100)))
    setDraft((d) => ({ ...d, focus: `${x}% ${y}%` }))
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Crop photo"
      wide
      onSubmit={() => {
        onSave(draft)
        onClose()
      }}
      submitLabel="Done"
    >
      <div className="grid gap-6 pt-1 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="mb-2 px-1 text-[0.8125rem] text-label-2">Tap or drag on the photo to choose what must stay in view.</p>
          <div
            ref={box}
            className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-xl bg-fill"
            onPointerDown={(e) => {
              ;(e.target as Element).setPointerCapture?.(e.pointerId)
              place(e.clientX, e.clientY)
            }}
            onPointerMove={(e) => e.buttons === 1 && place(e.clientX, e.clientY)}
          >
            <img src={imageUrl(draft.src, 1080)} alt="" className="block w-full" draggable={false} />
            <span
              className="pointer-events-none absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_4px_14px_rgba(0,0,0,0.35)]"
              style={{ left: `${fx}%`, top: `${fy}%` }}
            >
              <span className="absolute inset-[11px] rounded-full bg-white" />
            </span>
          </div>
          <label className="mt-4 block px-1">
            <span className="flex items-center justify-between text-[0.8125rem] font-medium text-label-2">
              Zoom <span className="num">{draft.zoom.toFixed(2)}×</span>
            </span>
            <input type="range" min={1} max={2.5} step={0.05} value={Math.max(1, draft.zoom)} onChange={(e) => setDraft({ ...draft, zoom: Number(e.target.value) })} className="mt-2 w-full accent-[var(--accent)]" />
          </label>
          <Button size="sm" variant="plain" className="mt-1 px-1" onClick={() => setDraft({ ...draft, focus: '50% 50%', zoom: 1 })}>
            Reset to centre
          </Button>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <span className="text-[0.8125rem] font-medium text-label-2">How it looks</span>
            <Segmented value={view} onChange={setView} options={[{ value: 'site', label: 'Website' }, { value: 'phone', label: 'Tall' }]} className="w-44" />
          </div>
          <div className={cx('mx-auto', view === 'phone' ? 'max-w-[13rem]' : '')}>
            <Framed image={draft} aspect={view === 'phone' ? '3 / 4' : aspect} width={1080} />
          </div>
          <p className="mt-2 px-1 text-[0.8125rem] text-label-2">Frames change shape across screen sizes; the point you chose is always kept in view.</p>
        </div>
      </div>
    </Sheet>
  )
}
