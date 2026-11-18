export class ApiError extends Error {
  status: number
  code: string | null
  constructor(status: number, message: string, code: string | null) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** Thrown when the request never reached the server (offline, timeout). */
export class OfflineError extends Error {
  constructor() {
    super('No connection. Nothing was saved — your entry is still in the form, try again when you’re back online.')
  }
}

type Listener = (online: boolean) => void
const listeners = new Set<Listener>()
let lastOnline = true
export function onConnectionChange(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
function setOnline(v: boolean) {
  if (v !== lastOnline) {
    lastOnline = v
    listeners.forEach((l) => l(v))
  }
}

let onAuthLost: (() => void) | null = null
export function setAuthLostHandler(fn: () => void) {
  onAuthLost = fn
}

interface Options {
  /** Milliseconds before giving up (default 20 s). */
  timeout?: number
  /** Send these bytes as the body instead of JSON. */
  bytes?: Uint8Array
}

async function request(method: string, path: string, body: unknown, { timeout = 20000, bytes }: Options): Promise<Response> {
  let res: Response
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    res = await fetch('/api/' + path, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': bytes ? 'application/octet-stream' : 'application/json', 'X-TK-Client': '1' },
      body: bytes ? (bytes as BodyInit) : body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
      cache: 'no-store',
    })
  } catch {
    setOnline(false)
    throw new OfflineError()
  } finally {
    clearTimeout(timer)
  }
  setOnline(true)
  if (!res.ok) await readJson(res)
  return res
}

async function readJson<T>(res: Response): Promise<T> {
  let json: { error?: string; code?: string } & Record<string, unknown>
  try {
    json = await res.json()
  } catch {
    throw new ApiError(res.status, 'The server sent back something unexpected. Please try again.', 'server')
  }
  if (!res.ok) {
    if (res.status === 401 && json.code === 'auth') onAuthLost?.()
    throw new ApiError(res.status, json.error ?? 'Something went wrong.', json.code ?? null)
  }
  return json as T
}

export async function api<T = unknown>(method: string, path: string, body?: unknown, opts: Options = {}): Promise<T> {
  return readJson<T>(await request(method, path, body, opts))
}

/** Downloads a file from the API as bytes. */
export async function getBytes(path: string, timeout = 120000): Promise<Uint8Array> {
  const res = await request('GET', path, undefined, { timeout })
  try {
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    setOnline(false)
    throw new OfflineError()
  }
}

export const get = <T,>(path: string) => api<T>('GET', path)
export const post = <T,>(path: string, body?: unknown, opts?: Options) => api<T>('POST', path, body ?? {}, opts)
export const put = <T,>(path: string, body?: unknown) => api<T>('PUT', path, body ?? {})
export const del = <T,>(path: string) => api<T>('DELETE', path)
