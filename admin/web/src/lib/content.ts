import { defaultContent, photos, type SiteContent } from '@site/content/defaults'
import { normalize } from '@site/content/normalize'
import type { CmsImage } from '@site/content/types'

export type { SiteContent, CmsImage }
export { defaultContent, normalize }

/** The public website, shown in the live preview. */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://thandakapda.co').replace(/\/$/, '')

/** Turns any stored content into a complete document shaped like the defaults. */
export const toDoc = (data: unknown): SiteContent => normalize(defaultContent, data)

// ---------------------------------------------------------------- paths

/** Reads "home.hero.title" or "products.0.gallery.2" from a document. */
export function getAt(obj: unknown, path: string): unknown {
  if (!path) return obj
  return path.split('.').reduce<unknown>((o, k) => (o !== null && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj)
}

/** Returns a copy of obj with the value at path replaced; untouched branches are shared. */
export function setAt<T>(obj: T, path: string, value: unknown): T {
  if (!path) return value as T
  const [head, ...rest] = path.split('.')
  const container = obj as unknown as Record<string, unknown> | unknown[]
  const next = Array.isArray(container) ? [...container] : { ...(container as Record<string, unknown>) }
  const child = (container as Record<string, unknown>)[head]
  ;(next as Record<string, unknown>)[head] = setAt(child, rest.join('.'), value)
  return next as T
}

export function same(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  return ka.length === kb.length && ka.every((k) => same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

// ---------------------------------------------------------------- images

/** Absolute URL for an image src (built-in photos live on the website). */
export function imageUrl(src: string, width?: number): string {
  const [base, hint] = src.split('#')
  let file = base
  const list = hint?.match(/^w=([\d,]+)$/)?.[1]
  if (list && width) {
    const widths = list.split(',').map(Number).sort((a, b) => a - b)
    const max = widths[widths.length - 1]
    const pick = widths.find((w) => w >= width) ?? max
    if (pick !== max) file = base.replace(new RegExp(`-${max}(\\.[a-z]+)$`), `-${pick}$1`)
  }
  return file.startsWith('/') ? SITE_URL + file : file
}

export const emptyImage = (): CmsImage => ({ src: '', alt: '', width: 0, height: 0, focus: '50% 50%', zoom: 1 })

/** The photos that ship with the website, offered alongside uploads. */
export const builtInPhotos: { label: string; image: CmsImage }[] = [
  { label: 'Morning Spring · plate', image: photos.msPlate() },
  { label: 'Morning Spring · wedding table', image: photos.msTable() },
  { label: 'Morning Spring · open box', image: photos.msBox() },
  { label: 'Morning Spring · hotel tray', image: photos.msHotel() },
  { label: 'Morning Spring · in the sun', image: photos.msLifestyle1() },
  { label: 'Morning Spring · everyday', image: photos.msLifestyle2() },
  { label: 'Namasté · plate', image: photos.nPlate() },
  { label: 'Namasté · café table', image: photos.nCafe() },
  { label: 'Namasté · marble counter', image: photos.nMarble() },
  { label: 'Namasté · gym bench', image: photos.nGym() },
  { label: 'Namasté · school desk', image: photos.nClassroom() },
  { label: 'Namasté · artwork', image: photos.nPoster() },
]

/** CSS for showing an image cropped the way the website will. */
export function cropStyle(img: CmsImage): React.CSSProperties {
  const focus = /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(img.focus) ? img.focus : '50% 50%'
  const zoom = img.zoom > 1 ? Math.min(img.zoom, 4) : 1
  return { objectPosition: focus, transform: zoom === 1 ? undefined : `scale(${zoom})`, transformOrigin: focus }
}
