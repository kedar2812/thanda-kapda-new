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

export async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20000)
    res = await fetch('/api/' + path, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-TK-Client': '1' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
  } catch {
    setOnline(false)
    throw new OfflineError()
  }
  setOnline(true)

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

export const get = <T,>(path: string) => api<T>('GET', path)
export const post = <T,>(path: string, body?: unknown) => api<T>('POST', path, body ?? {})
export const put = <T,>(path: string, body?: unknown) => api<T>('PUT', path, body ?? {})
export const del = <T,>(path: string) => api<T>('DELETE', path)
