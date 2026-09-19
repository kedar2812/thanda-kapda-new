import { useMemo, useState, type ReactNode } from 'react'
import { Download, Plus } from 'lucide-react'
import { useNames } from '@/lib/data'
import { todayISO } from '@/lib/format'
import type { MasterTable } from '@/lib/types'
import { Button, DateInput, Field, IconButton, Notice, Select, cx } from './ui'
import { useIsDesktop } from './Sheet'

/** Dropdown for a master list. Archived items are hidden unless already chosen. */
export function MasterSelect({ table, label, value, onChange, required, placeholder }: { table: MasterTable; label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  const names = useNames()
  return (
    <Field label={label} required={required}>
      <Select value={value} onChange={onChange} placeholder={placeholder ?? 'Choose…'} aria-required={required}>
        {names.options(table, value ? Number(value) : null).map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.archived ? ' (archived)' : ''}
          </option>
        ))}
      </Select>
    </Field>
  )
}

export function FormError({ error }: { error: string | null }) {
  return error ? (
    <div className="mb-4">
      <Notice tone="red">{error}</Notice>
    </div>
  ) : null
}

export function DeleteButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <Button variant="destructive" size="lg" className="w-full" onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  )
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  const desktop = useIsDesktop()
  return desktop ? (
    <Button onClick={onClick} icon={<Plus className="size-4" strokeWidth={2.6} />}>
      {label}
    </Button>
  ) : (
    <IconButton label={label} onClick={onClick} className="bg-accent-soft">
      <Plus className="size-5" strokeWidth={2.6} />
    </IconButton>
  )
}

// ---------------------------------------------------------------- date range

export type Range = { from: string; to: string }
export type RangePreset = 'all' | 'month' | 'last-month' | 'fy' | 'custom'

function fyStart(today: string) {
  const [y, m] = today.split('-').map(Number)
  return `${m >= 4 ? y : y - 1}-04-01`
}

export function presetRange(p: RangePreset, custom: Range): Range {
  const t = todayISO()
  const [y, m] = t.split('-').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  switch (p) {
    case 'all':
      return { from: '', to: '' }
    case 'month':
      return { from: `${y}-${pad(m)}-01`, to: t }
    case 'last-month': {
      const ly = m === 1 ? y - 1 : y
      const lm = m === 1 ? 12 : m - 1
      const last = new Date(Date.UTC(ly, lm, 0)).getUTCDate()
      return { from: `${ly}-${pad(lm)}-01`, to: `${ly}-${pad(lm)}-${pad(last)}` }
    }
    case 'fy':
      return { from: fyStart(t), to: t }
    default:
      return custom
  }
}

export function useDateRange(initial: RangePreset = 'all') {
  const [preset, setPreset] = useState<RangePreset>(initial)
  const [custom, setCustom] = useState<Range>({ from: '', to: '' })
  const range = useMemo(() => presetRange(preset, custom), [preset, custom])
  const inRange = (d: string) => (!range.from || d >= range.from) && (!range.to || d <= range.to)
  return { preset, setPreset, custom, setCustom, range, inRange }
}

export function DateRangePicker({ state }: { state: ReturnType<typeof useDateRange> }) {
  const { preset, setPreset, custom, setCustom } = state
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Date range"
        value={preset}
        onChange={(e) => setPreset(e.target.value as RangePreset)}
        className="h-9 appearance-none rounded-[0.625rem] bg-fill px-3 pr-3 text-[0.875rem] font-medium text-label outline-none"
      >
        <option value="all">All time</option>
        <option value="month">This month</option>
        <option value="last-month">Last month</option>
        <option value="fy">This financial year</option>
        <option value="custom">Choose dates…</option>
      </select>
      {preset === 'custom' && (
        <div className="flex items-center gap-1.5">
          <DateInput aria-label="From" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="h-9 w-[9.5rem] rounded-[0.625rem] bg-fill text-[0.875rem]" />
          <span className="text-label-2">–</span>
          <DateInput aria-label="To" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="h-9 w-[9.5rem] rounded-[0.625rem] bg-fill text-[0.875rem]" />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- toolbar

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center', className)}>{children}</div>
}

// ---------------------------------------------------------------- CSV

export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM so Excel opens ₹ and names correctly.
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton label="Export to Excel (CSV)" onClick={onClick}>
      <Download className="size-5" strokeWidth={2.2} />
    </IconButton>
  )
}

/** Simple case-insensitive search across several strings. */
export function matches(q: string, ...fields: (string | null | undefined)[]) {
  if (!q.trim()) return true
  const needle = q.trim().toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(needle))
}

export function useToday() {
  return todayISO()
}

// ---------------------------------------------------------------- editor sheets

/**
 * Keeps the last opened item around while its sheet animates closed, so forms
 * can own their <Sheet> without the exit animation losing its content.
 */
export function Editor<T extends { id: number }>({ item, render }: { item: T | 'new' | null; render: (item: T | null, open: boolean) => ReactNode }) {
  const [state, setState] = useState<{ last: T | 'new' | null; prev: T | 'new' | null; session: number }>({ last: item, prev: item, session: 0 })
  if (item !== state.prev) {
    // Every fresh opening gets a new session so abandoned edits never reappear.
    setState({ last: item ?? state.last, prev: item, session: item !== null ? state.session + 1 : state.session })
  }
  if (state.last === null) return null
  return <div key={state.session}>{render(state.last === 'new' ? null : state.last, item !== null)}</div>
}
