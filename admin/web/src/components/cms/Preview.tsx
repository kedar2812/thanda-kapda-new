import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ExternalLink, Monitor, RotateCw, Smartphone } from 'lucide-react'
import { SITE_URL, type SiteContent } from '@/lib/content'
import { IconButton, Segmented, cx } from '@/components/ui'

const SITE_ORIGIN = new URL(SITE_URL).origin
const clean = (p: string) => p.replace(/\/+$/, '') || '/'
const framePath = (p: string) => (clean(p) === '/' ? '/' : `${clean(p)}/`)

export type Device = 'desktop' | 'phone'
const WIDTH: Record<Device, number> = { desktop: 1280, phone: 390 }

/**
 * The real website in a frame, showing the draft. The site runs in preview
 * mode (no animations, links to other sites disabled) and receives the draft
 * by postMessage, so what you see is exactly what will be published.
 */
export function LivePreview({
  doc,
  path,
  section,
  onSelect,
  device,
  onDevice,
  className,
}: {
  doc: SiteContent
  /** Page the section lives on, e.g. "/story". */
  path: string
  section: string | null
  onSelect: (sectionId: string) => void
  device: Device
  onDevice: (d: Device) => void
  className?: string
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState(() => `${SITE_URL}${framePath(path)}?tk-preview=1`)
  const [ready, setReady] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const selectRef = useRef(onSelect)
  useEffect(() => {
    selectRef.current = onSelect
  })

  const post = (msg: Record<string, unknown>) => frame.current?.contentWindow?.postMessage({ source: 'tk-admin', ...msg }, SITE_ORIGIN)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== SITE_ORIGIN || e.data?.source !== 'tk-site' || e.source !== frame.current?.contentWindow) return
      if (e.data.type === 'ready') {
        setReady(true)
        setCurrent(clean(e.data.path))
      } else if (e.data.type === 'path') {
        setCurrent(clean(e.data.path))
      } else if (e.data.type === 'select' && typeof e.data.section === 'string') {
        selectRef.current(e.data.section)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Send the draft (lightly debounced while typing).
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => post({ type: 'content', content: doc }), 180)
    return () => clearTimeout(t)
  }, [doc, ready])

  // Follow the section being edited: go to its page, then scroll to it. Only
  // the editor's choice drives this, so browsing inside the preview is left alone.
  const pending = useRef(false)
  useEffect(() => {
    if (!ready) return
    // Reads the latest `current` without re-running when the visitor browses.
    if (current !== clean(path)) {
      pending.current = true
      post({ type: 'navigate', path: framePath(path) })
    } else if (section) {
      post({ type: 'focus', section })
    }
  }, [path, section, ready])
  useEffect(() => {
    if (pending.current && current === clean(path)) {
      pending.current = false
      // Give the new page a moment to render before scrolling to the section.
      const t = setTimeout(() => section && post({ type: 'focus', section }), 250)
      return () => clearTimeout(t)
    }
  }, [current])

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const width = WIDTH[device]
  const scale = size.w ? Math.min(1, size.w / width) : 1

  return (
    <div className={cx('flex min-h-0 flex-col', className)}>
      <div className="flex items-center gap-2 pb-2">
        <Segmented<Device>
          value={device}
          onChange={onDevice}
          options={[
            { value: 'desktop', label: <span className="inline-flex items-center gap-1.5"><Monitor className="size-3.5" /> Computer</span> },
            { value: 'phone', label: <span className="inline-flex items-center gap-1.5"><Smartphone className="size-3.5" /> Phone</span> },
          ]}
          className="w-60"
        />
        <span className="flex-1" />
        <IconButton
          label="Reload preview"
          onClick={() => {
            setReady(false)
            setSrc(`${SITE_URL}${framePath(path)}?tk-preview=1&r=${Date.now()}`)
          }}
        >
          <RotateCw className="size-[1.05rem]" />
        </IconButton>
        <a href={`${SITE_URL}${framePath(path)}`} target="_blank" rel="noreferrer" className="pressable grid size-9 place-items-center rounded-full text-accent hover:bg-fill" aria-label="Open the live website" title="Open the live website">
          <ExternalLink className="size-[1.05rem]" />
        </a>
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[#e9e4d8] shadow-card ring-1 ring-separator dark:bg-[#2a2722]">
        <div className="absolute top-0 left-1/2 origin-top" style={{ width, height: size.h / scale, transform: `translateX(-50%) scale(${scale})` }}>
          <iframe
            ref={frame}
            key={src}
            src={src}
            title="Website preview"
            className={cx('size-full bg-white', device === 'phone' && 'rounded-[1.5rem]')}
          />
        </div>
        {!ready && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="chrome rounded-full px-3 py-1.5 text-[0.75rem] font-medium text-label-2 ring-1 ring-separator">Loading the website…</span>
          </div>
        )}
      </div>
      <p className="pt-2 text-center text-[0.75rem] text-label-3">Preview of your draft. Hover a section and press Edit to jump to it.</p>
    </div>
  )
}
