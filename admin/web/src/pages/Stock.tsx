import { useMemo, useState } from 'react'
import { ArrowRightLeft, Boxes, SlidersHorizontal } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { DeleteButton, Editor, ExportButton, FormError, MasterSelect, downloadCsv } from '@/components/common'
import {
  Button, DateInput, Empty, Field, FormGrid, Group, Loading, Notice, NumberInput, Row, Segmented, Select, TextArea, cx,
} from '@/components/ui'
import { useList, useNames, useReport } from '@/lib/data'
import { date, month, qty, todayISO } from '@/lib/format'
import { num, toValues, useRecordForm } from '@/lib/form'
import type { StockAdjustment, StockGrid, StockMove, StockTransfer } from '@/lib/types'
import { byMonth } from './Sales'

const REASONS = ['Opening stock', 'New production received', 'Damaged', 'Count correction', 'Returned by customer', 'Other']

type Tab = 'grid' | 'adjustments' | 'transfers'

function useStockLookup() {
  const { data } = useReport<StockGrid>('stock')
  return useMemo(() => {
    const m = new Map<string, number>()
    data?.cells.forEach((c) => m.set(`${c.design_id}:${c.location_id}`, c.qty))
    return (d: number, l: number) => m.get(`${d}:${l}`) ?? 0
  }, [data])
}

export default function Stock() {
  const [tab, setTab] = useState<Tab>('grid')
  const [adjust, setAdjust] = useState<StockAdjustment | 'new' | null>(null)
  const [transfer, setTransfer] = useState<StockTransfer | 'new' | null>(null)
  const [cell, setCell] = useState<{ design: number; location: number } | null>(null)

  return (
    <Page
      title="Stock"
      actions={
        <>
          <Button variant="tinted" size="sm" icon={<ArrowRightLeft className="size-3.5" strokeWidth={2.6} />} onClick={() => setTransfer('new')}>
            Move
          </Button>
          <Button size="sm" icon={<SlidersHorizontal className="size-3.5" strokeWidth={2.6} />} onClick={() => setAdjust('new')}>
            Adjust
          </Button>
        </>
      }
      toolbar={
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'grid', label: 'Stock' },
            { value: 'adjustments', label: 'Adjustments' },
            { value: 'transfers', label: 'Moves' },
          ]}
          className="md:w-96"
        />
      }
    >
      {tab === 'grid' && <StockTable onCell={(design, location) => setCell({ design, location })} />}
      {tab === 'adjustments' && <AdjustmentList onOpen={setAdjust} />}
      {tab === 'transfers' && <TransferList onOpen={setTransfer} />}

      <Editor item={adjust} render={(a, open) => <AdjustmentForm adj={a} open={open} onDone={() => setAdjust(null)} />} />
      <Editor item={transfer} render={(t, open) => <TransferForm tr={t} open={open} onDone={() => setTransfer(null)} />} />
      <CellHistory cell={cell} onClose={() => setCell(null)} />
    </Page>
  )
}

function StockTable({ onCell }: { onCell: (design: number, location: number) => void }) {
  const names = useNames()
  const { data, isLoading } = useReport<StockGrid>('stock')
  const at = useStockLookup()

  const { designs, locations } = useMemo(() => {
    const used = new Set(data?.cells.filter((c) => c.qty !== 0).flatMap((c) => [`d${c.design_id}`, `l${c.location_id}`]))
    return {
      designs: names.masters.designs.filter((d) => !d.archived || used.has(`d${d.id}`)),
      locations: names.masters.locations.filter((l) => !l.archived || used.has(`l${l.id}`)),
    }
  }, [data, names])

  if (isLoading) return <Loading />

  const rowTotal = (d: number) => locations.reduce((a, l) => a + at(d, l.id), 0)
  const colTotal = (l: number) => designs.reduce((a, d) => a + at(d.id, l), 0)
  const grand = designs.reduce((a, d) => a + rowTotal(d.id), 0)

  const exportCsv = () =>
    downloadCsv(
      'stock.csv',
      ['Design', ...locations.map((l) => l.name), 'Total'],
      [...designs.map((d) => [d.name, ...locations.map((l) => at(d.id, l.id)), rowTotal(d.id)]), ['Total', ...locations.map((l) => colTotal(l.id)), grand]],
    )

  const numCell = (v: number, bold?: boolean) => (
    <span className={cx('num', v < 0 && 'font-semibold text-red', v === 0 && 'text-label-3', bold && 'font-semibold')}>{qty(v)}</span>
  )

  return (
    <>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[0.8125rem] text-label-2">Pieces of each design at each place. Tap a number to see its history.</p>
        <ExportButton onClick={exportCsv} />
      </div>
      <div className="mb-7 overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.875rem]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-[0.75rem] font-medium text-label-2">Design</th>
                {locations.map((l) => (
                  <th key={l.id} className="min-w-[6.5rem] px-3 py-3 text-right text-[0.75rem] font-medium text-label-2">{l.name}</th>
                ))}
                <th className="min-w-[5.5rem] bg-surface-2 px-4 py-3 text-right text-[0.75rem] font-semibold text-label">Total</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((d) => (
                <tr key={d.id} className="border-t border-separator">
                  <th scope="row" className="sticky left-0 z-10 max-w-[10rem] truncate bg-surface px-4 py-0 text-left font-normal">
                    {d.name}
                    {d.archived && <span className="ml-1 text-[0.75rem] text-label-3">(archived)</span>}
                  </th>
                  {locations.map((l) => (
                    <td key={l.id} className="p-0 text-right">
                      <button type="button" onClick={() => onCell(d.id, l.id)} className="row-press block h-11 w-full px-3 text-right" aria-label={`${d.name} at ${l.name}: ${at(d.id, l.id)} pieces. Show history`}>
                        {numCell(at(d.id, l.id))}
                      </button>
                    </td>
                  ))}
                  <td className="bg-surface-2 px-4 text-right">{numCell(rowTotal(d.id), true)}</td>
                </tr>
              ))}
              <tr className="border-t border-separator bg-surface-2">
                <th scope="row" className="sticky left-0 z-10 bg-surface-2 px-4 py-3 text-left font-semibold">Total</th>
                {locations.map((l) => (
                  <td key={l.id} className="px-3 py-3 text-right">{numCell(colTotal(l.id), true)}</td>
                ))}
                <td className="px-4 py-3 text-right text-[1rem]">{numCell(grand, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function CellHistory({ cell, onClose }: { cell: { design: number; location: number } | null; onClose: () => void }) {
  const names = useNames()
  const [last, setLast] = useState(cell)
  if (cell && cell !== last) setLast(cell)
  const c = cell ?? last
  const { data, isLoading } = useReport<StockMove[]>('stock-history', { design_id: c?.design, location_id: c?.location }, !!c)
  return (
    <Sheet open={cell !== null} onClose={onClose} title={c ? `${names.name('designs', c.design)} · ${names.name('locations', c.location)}` : ''}>
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty icon={<Boxes className="size-7" />} title="No movements yet" body="Adjustments, sales, samples, Amazon orders and moves appear here." />
      ) : (
        <Group className="mt-1">
          {data.map((m, i) => (
            <Row
              key={`${m.type}-${m.id}-${i}`}
              title={m.label}
              subtitle={date(m.date)}
              trailing={<span className={m.change < 0 ? 'text-red' : 'text-green'}>{m.change > 0 ? '+' : ''}{qty(m.change)}</span>}
              trailingSub={`Left: ${qty(m.balance)}`}
            />
          ))}
        </Group>
      )}
    </Sheet>
  )
}

function AdjustmentList({ onOpen }: { onOpen: (a: StockAdjustment) => void }) {
  const names = useNames()
  const { data, isLoading } = useList<StockAdjustment>('stock_adjustments')
  if (isLoading) return <Loading />
  if (!data?.length) return <Empty icon={<SlidersHorizontal className="size-7" />} title="No adjustments yet" body="Use Adjust to add opening stock, new production or corrections." />
  const label = (a: StockAdjustment) => (a.mode === 'set' ? `Set to ${qty(a.quantity)}` : `${a.mode === 'add' ? '+' : '−'}${qty(a.quantity)}`)
  return byMonth(data).map((g) => (
    <Group key={g.key} title={month(g.key)}>
      {g.items.map((a) => (
        <Row key={a.id} onClick={() => onOpen(a)} title={`${names.name('designs', a.design_id)} · ${names.name('locations', a.location_id)}`} subtitle={`${date(a.date)} · ${a.reason}`} trailing={<span className={a.mode === 'remove' ? 'text-red' : ''}>{label(a)}</span>} />
      ))}
    </Group>
  ))
}

function TransferList({ onOpen }: { onOpen: (t: StockTransfer) => void }) {
  const names = useNames()
  const { data, isLoading } = useList<StockTransfer>('stock_transfers')
  if (isLoading) return <Loading />
  if (!data?.length) return <Empty icon={<ArrowRightLeft className="size-7" />} title="No stock moved yet" body="Use Move when stock goes from one place to another." />
  return (
    <Group>
      {data.map((t) => (
        <Row key={t.id} onClick={() => onOpen(t)} title={names.name('designs', t.design_id)} subtitle={`${date(t.date)} · ${names.name('locations', t.from_location_id)} → ${names.name('locations', t.to_location_id)}`} trailing={`${qty(t.quantity)} pcs`} />
      ))}
    </Group>
  )
}

function AdjustmentForm({ adj, open, onDone }: { adj: StockAdjustment | null; open: boolean; onDone: () => void }) {
  const names = useNames()
  const at = useStockLookup()
  const f = useRecordForm(toValues(adj, { date: todayISO(), design_id: '', location_id: '', mode: 'add', quantity: '', reason: 'New production received', note: '' }), {
    table: 'stock_adjustments',
    saved: adj ? 'Adjustment updated' : 'Stock updated',
    onDone,
  })
  const v = f.values
  const current = useMemo(() => {
    if (!v.design_id || !v.location_id) return null
    let c = at(Number(v.design_id), Number(v.location_id))
    // When editing, take this adjustment's own effect back out (not exact for "set", which is fine for a preview).
    if (adj && adj.design_id === Number(v.design_id) && adj.location_id === Number(v.location_id) && adj.mode !== 'set') c -= adj.mode === 'add' ? adj.quantity : -adj.quantity
    return c
  }, [v.design_id, v.location_id, at, adj])
  const after = current === null || v.quantity === '' ? null : v.mode === 'set' ? num(v.quantity) : v.mode === 'add' ? current + num(v.quantity) : current - num(v.quantity)

  return (
    <Sheet open={open} onClose={onDone} title={adj ? 'Edit adjustment' : 'Adjust stock'} onSubmit={() => f.save()} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <Segmented
          value={v.mode}
          onChange={(x) => f.set('mode', x)}
          options={[
            { value: 'add', label: 'Add' },
            { value: 'remove', label: 'Remove' },
            { value: 'set', label: 'Set count to' },
          ]}
        />
        <FormGrid>
          <MasterSelect table="designs" label="Design" value={v.design_id} onChange={(x) => f.set('design_id', x)} required />
          <MasterSelect table="locations" label="Location" value={v.location_id} onChange={(x) => f.set('location_id', x)} required />
          <Field label={v.mode === 'set' ? 'Counted pieces' : 'Pieces'} required>
            <NumberInput decimal={false} value={v.quantity} onChange={(x) => f.set('quantity', x)} placeholder="0" />
          </Field>
          <Field label="Date" required>
            <DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} />
          </Field>
          <Field label="Reason" required className="sm:col-span-2">
            <Select value={v.reason} onChange={(x) => f.set('reason', x)}>
              {[...new Set([...REASONS, v.reason].filter(Boolean))].map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
        </FormGrid>
        {after !== null && (
          after < 0 ? (
            <Notice>Stock at {names.name('locations', Number(v.location_id))} will go to <b className="num">{qty(after)}</b>.</Notice>
          ) : (
            <p className="px-1 text-[0.875rem] text-label-2">
              {names.name('designs', Number(v.design_id))} at {names.name('locations', Number(v.location_id))}: <span className="num">{qty(current ?? 0)}</span> → <b className="num text-label">{qty(after)}</b>
            </p>
          )
        )}
        <Field label="Note">
          <TextArea value={v.note} onChange={(e) => f.set('note', e.target.value)} placeholder="Optional" />
        </Field>
        {f.isEdit && <DeleteButton label="Delete adjustment" onClick={() => f.remove('adjustment')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}

function TransferForm({ tr, open, onDone }: { tr: StockTransfer | null; open: boolean; onDone: () => void }) {
  const names = useNames()
  const at = useStockLookup()
  const f = useRecordForm(toValues(tr, { date: todayISO(), design_id: '', from_location_id: '', to_location_id: '', quantity: '', note: '' }), {
    table: 'stock_transfers',
    saved: tr ? 'Move updated' : 'Stock moved',
    onDone,
  })
  const v = f.values
  const same = v.from_location_id && v.from_location_id === v.to_location_id
  const fromNow = v.design_id && v.from_location_id ? at(Number(v.design_id), Number(v.from_location_id)) + (tr && tr.design_id === Number(v.design_id) && tr.from_location_id === Number(v.from_location_id) ? tr.quantity : 0) : null
  const fromAfter = fromNow === null ? null : fromNow - num(v.quantity)

  return (
    <Sheet
      open={open}
      onClose={onDone}
      title={tr ? 'Edit move' : 'Move stock'}
      onSubmit={() => (same ? f.setError('Choose two different locations.') : num(v.quantity) <= 0 ? f.setError('Enter how many pieces to move.') : f.save())}
      busy={f.busy}
    >
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <FormGrid>
          <MasterSelect table="designs" label="Design" value={v.design_id} onChange={(x) => f.set('design_id', x)} required />
          <Field label="Pieces" required>
            <NumberInput decimal={false} value={v.quantity} onChange={(x) => f.set('quantity', x)} placeholder="0" />
          </Field>
          <MasterSelect table="locations" label="From" value={v.from_location_id} onChange={(x) => f.set('from_location_id', x)} required />
          <MasterSelect table="locations" label="To" value={v.to_location_id} onChange={(x) => f.set('to_location_id', x)} required />
          <Field label="Date" required>
            <DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} />
          </Field>
        </FormGrid>
        {same && <Notice tone="red">“From” and “To” must be different places.</Notice>}
        {fromAfter !== null && !same && (
          fromAfter < 0 ? (
            <Notice>{names.name('locations', Number(v.from_location_id))} only has <b className="num">{qty(fromNow ?? 0)}</b>. After this it will show <b className="num">{qty(fromAfter)}</b>.</Notice>
          ) : (
            <p className="px-1 text-[0.875rem] text-label-2">
              Left at {names.name('locations', Number(v.from_location_id))} after the move: <b className="num text-label">{qty(fromAfter)}</b>
            </p>
          )
        )}
        <Field label="Note">
          <TextArea value={v.note} onChange={(e) => f.set('note', e.target.value)} placeholder="Optional" />
        </Field>
        {f.isEdit && <DeleteButton label="Delete move" onClick={() => f.remove('move')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}
