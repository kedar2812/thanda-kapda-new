import { createContext, useContext } from 'react'
import { getAt, same, type SiteContent } from '@/lib/content'

export interface EditorApi {
  doc: SiteContent
  /** What is live on the website now, for "edited" markers and undo. */
  published: SiteContent
  set: (path: string, value: unknown) => void
}

export const EditorContext = createContext<EditorApi | null>(null)

export function useEditor() {
  const e = useContext(EditorContext)
  if (!e) throw new Error('useEditor outside the website editor')
  return e
}

/** The value at a path, whether it differs from the live site, and a setter. */
export function useField<T>(path: string) {
  const e = useEditor()
  const value = getAt(e.doc, path) as T
  const live = getAt(e.published, path) as T
  return {
    value,
    changed: !same(value, live),
    set: (v: T) => e.set(path, v),
    revert: () => e.set(path, live),
  }
}
