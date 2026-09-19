import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, OfflineError, del, post, put } from './api'
import { useConfirm, useToast } from '@/components/ui'

export type FormValues = Record<string, string>

/** Convert a record into string form values (inputs work with strings). */
export function toValues(rec: object | null | undefined, defaults: FormValues): FormValues {
  const out: FormValues = { ...defaults }
  if (rec) {
    for (const [k, v] of Object.entries(rec)) {
      if (v === null || v === undefined) out[k] = ''
      else if (typeof v !== 'object') out[k] = String(v)
    }
  }
  return out
}

interface Options {
  table: string
  /** Message after a successful save, e.g. "Sale saved". */
  saved: string
  /** Extra payload, e.g. a sale's payments list. */
  extra?: () => Record<string, unknown>
  onDone: () => void
}

/**
 * Save / delete with the dashboard's rules: server warnings that need a yes
 * (overpaid, duplicate order) are asked in-app and resent with a flag; when
 * offline the form stays open with everything the user typed.
 */
export function useRecordForm(initial: FormValues, { table, saved, extra, onDone }: Options) {
  const [values, setValues] = useState<FormValues>(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()
  const qc = useQueryClient()

  const set = (k: string, v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }))
    setError(null)
  }

  async function save(flags: Record<string, boolean> = {}): Promise<void> {
    setBusy(true)
    setError(null)
    const id = values.id ? Number(values.id) : null
    const body = { ...values, ...(extra?.() ?? {}), ...flags }
    try {
      if (id) await put(`${table}/${id}`, body)
      else await post(table, body)
      await qc.invalidateQueries()
      toast(saved)
      onDone()
    } catch (e) {
      if (e instanceof ApiError && e.code === 'overpay') {
        setBusy(false)
        const yes = await confirm({ title: 'Customer overpaid?', body: e.message.replace(' Did the customer overpay?', ''), confirm: 'Yes, save' })
        if (yes) return save({ ...flags, confirm_overpay: true })
        return
      }
      if (e instanceof ApiError && e.code === 'duplicate') {
        setBusy(false)
        const yes = await confirm({ title: 'Already in the list', body: e.message, confirm: 'Save anyway' })
        if (yes) return save({ ...flags, confirm_duplicate: true })
        return
      }
      setError(e instanceof ApiError || e instanceof OfflineError ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(what: string, body?: string) {
    const id = Number(values.id)
    if (!id) return
    const yes = await confirm({ title: `Delete this ${what}?`, body: body ?? 'This can’t be undone. Stock and balances will update straight away.', confirm: 'Delete', destructive: true })
    if (!yes) return
    setBusy(true)
    try {
      await del(`${table}/${id}`)
      await qc.invalidateQueries()
      toast(`${what[0].toUpperCase()}${what.slice(1)} deleted`)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.')
    } finally {
      setBusy(false)
    }
  }

  return { values, set, setValues, error, setError, busy, save, remove, isEdit: !!values.id }
}

/** Number helpers for previews. */
export const num = (v: string | undefined) => (v === undefined || v === '' ? 0 : Number(v))
