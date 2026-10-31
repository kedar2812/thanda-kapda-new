/**
 * Photos are prepared in the browser before upload: turned upright, scaled
 * to a few widths for different screens and compressed (WebP where the
 * browser can make it). A 5 MB phone photo usually ends up well under 1 MB in
 * total, and the server never has to process images itself.
 */

export const WIDTHS = [640, 1080, 1600, 2400]
const MAX = 2400

export interface MediaItem {
  id: number
  name: string
  alt: string
  url: string
  src: string
  thumb: string
  width: number
  height: number
  bytes: number
  widths: number[]
  created_at: string
  created_by: number | null
  used_in?: string[]
}

interface Prepared {
  width: number
  height: number
  type: string
  variants: { width: number; blob: Blob }[]
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** Halves in steps before the final size: one big jump looks soft and jagged. */
function scaled(source: CanvasImageSource, sw: number, sh: number, w: number, h: number) {
  let src: CanvasImageSource = source
  let cw = sw
  let ch = sh
  while (cw / 2 > w) {
    const next = canvas(Math.round(cw / 2), Math.round(ch / 2))
    const ctx = next.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(src, 0, 0, next.width, next.height)
    src = next
    cw = next.width
    ch = next.height
  }
  const out = canvas(w, h)
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, w, h)
  return out
}

const toBlob = (c: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => c.toBlob(resolve, type, quality))

async function decode(file: File): Promise<{ img: CanvasImageSource; w: number; h: number }> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return { img: bmp, w: bmp.width, h: bmp.height }
  } catch {
    // Older Safari: fall back to an <img>, which also honours EXIF rotation.
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return { img, w: img.naturalWidth, h: img.naturalHeight }
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

export async function preparePhoto(file: File): Promise<Prepared> {
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name)) {
    throw new Error('Please choose a photo (JPG, PNG, WebP or HEIC).')
  }
  let decoded
  try {
    decoded = await decode(file)
  } catch {
    throw new Error('This browser can’t open that photo. Try saving it as a JPG first.')
  }
  const { img, w: sw, h: sh } = decoded
  if (sw < 200 || sh < 200) throw new Error('That photo is too small to use on the website (under 200 pixels).')

  const full = Math.min(sw, MAX)
  const widths = [...new Set([...WIDTHS.filter((w) => w < full), full])]
  // Keep transparency for PNGs that need it; WebP holds it too.
  let type = 'image/webp'
  const probe = await toBlob(canvas(2, 2), type, 0.8)
  if (!probe || probe.type !== 'image/webp') type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'

  const variants: Prepared['variants'] = []
  for (const w of widths) {
    const h = Math.round((sh * w) / sw)
    const blob = await toBlob(scaled(img, sw, sh, w, h), type, type === 'image/jpeg' ? 0.84 : 0.8)
    if (!blob) throw new Error('Could not prepare the photo. Please try again.')
    variants.push({ width: w, blob })
  }
  if ('close' in img && typeof img.close === 'function') img.close()
  return { width: full, height: Math.round((sh * full) / sw), type, variants }
}

/** Uploads a prepared photo with progress (0–1). */
export function uploadPhoto(p: Prepared, name: string, alt: string, onProgress: (f: number) => void): Promise<MediaItem> {
  const ext = p.type === 'image/webp' ? 'webp' : p.type === 'image/png' ? 'png' : 'jpg'
  const form = new FormData()
  form.append('name', name)
  form.append('alt', alt)
  for (const v of p.variants) form.append(`w${v.width}`, v.blob, `w${v.width}.${ext}`)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/media')
    xhr.setRequestHeader('X-TK-Client', '1')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onerror = () => reject(new Error('No connection. The photo wasn’t uploaded.'))
    xhr.onload = () => {
      let json: (MediaItem & { error?: string }) | null = null
      try {
        json = JSON.parse(xhr.responseText)
      } catch {
        /* handled below */
      }
      if (xhr.status >= 200 && xhr.status < 300 && json) resolve(json)
      else reject(new Error(json?.error ?? 'The upload failed. Please try again.'))
    }
    xhr.send(form)
  })
}

export function bytes(n: number) {
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`
}
