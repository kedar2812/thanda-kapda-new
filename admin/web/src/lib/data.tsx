import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { del, get, OfflineError, onConnectionChange, post, put } from './api'
import type { Boot, Master, MasterTable } from './types'

// ---------------------------------------------------------------- queries

export function useBoot() {
  return useQuery({ queryKey: ['bootstrap'], queryFn: () => get<Boot>('bootstrap'), staleTime: Infinity })
}

export function useList<T>(table: string) {
  return useQuery({ queryKey: ['list', table], queryFn: () => get<T[]>(table) })
}

export function useReport<T>(name: string, params: Record<string, string | number | null | undefined> = {}, enabled = true) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '') as [string, string][],
  ).toString()
  return useQuery({
    queryKey: ['report', name, qs],
    queryFn: () => get<T>(`reports/${name}${qs ? '?' + qs : ''}`),
    enabled,
  })
}

/** Save (create or update) a record. Any write refreshes every view. */
export function useSave<T extends { id?: number }>(table: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<T> & Record<string, unknown>) =>
      id ? put<T>(`${table}/${id}`, body) : post<T>(table, body),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useRemove(table: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => del<{ archived?: boolean; deleted?: boolean }>(`${table}/${id}`),
    onSuccess: () => qc.invalidateQueries(),
  })
}

// ---------------------------------------------------------------- names

export interface Names {
  masters: Record<MasterTable, Master[]>
  name: (table: MasterTable, id: number | null | undefined) => string
  /** Active items for dropdowns, plus the currently selected one even if archived. */
  options: (table: MasterTable, keep?: number | null) => Master[]
  user: (id: number | null | undefined) => string
}

export function useNames(): Names {
  const { data } = useBoot()
  return useMemo(() => {
    const masters = data?.masters ?? { designs: [], locations: [], accounts: [], categories: [], people: [] }
    const maps = Object.fromEntries(
      Object.entries(masters).map(([k, list]) => [k, new Map(list.map((m) => [m.id, m]))]),
    ) as Record<MasterTable, Map<number, Master>>
    return {
      masters,
      name: (table, id) => (id ? (maps[table].get(id)?.name ?? '—') : '—'),
      options: (table, keep) => masters[table].filter((m) => !m.archived || m.id === keep),
      user: (id) => (id ? (data?.user_names[String(id)] ?? 'Someone') : '—'),
    }
  }, [data])
}

// ---------------------------------------------------------------- live sync

export type SyncState = 'live' | 'syncing' | 'offline'
const SyncContext = createContext<SyncState>('live')
export const useSyncState = () => useContext(SyncContext)

/**
 * Polls a tiny "version" number. When a partner saves anything the number
 * changes and every open view refetches, so nobody needs to refresh.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [state, setState] = useState<SyncState>('live')
  const version = useRef<number | null>(null)

  useEffect(() => onConnectionChange((online) => setState(online ? 'live' : 'offline')), [])

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    let busy = false

    async function tick() {
      if (busy) return
      busy = true
      if (document.visibilityState === 'visible') {
        try {
          const { version: v } = await get<{ version: number }>('version')
          if (version.current !== null && v !== version.current) {
            setState('syncing')
            await qc.invalidateQueries()
          }
          version.current = v
          setState('live')
        } catch (e) {
          if (e instanceof OfflineError) setState('offline')
        }
      }
      busy = false
      clearTimeout(timer)
      if (!stopped) timer = setTimeout(tick, 4000)
    }
    tick()

    const wake = () => {
      clearTimeout(timer)
      tick()
    }
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('online', wake)
    const off = () => setState('offline')
    window.addEventListener('offline', off)
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('online', wake)
      window.removeEventListener('offline', off)
    }
  }, [qc])

  return <SyncContext.Provider value={state}>{children}</SyncContext.Provider>
}
