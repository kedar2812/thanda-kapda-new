import { useMemo, useState } from 'react'
import { Gift } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { AddButton, DateRangePicker, DeleteButton, Editor, ExportButton, FormError, MasterSelect, Toolbar, downloadCsv, matches, useDateRange } from '@/components/common'
import { Button, DateInput, Empty, Field, FormGrid, Group, Loading, Notice, NumberInput, Row, SearchField, Stat, StatGrid, TextArea, TextInput } from '@/components/ui'
import { useList, useNames, useReport } from '@/lib/data'
import { date, month, qty, todayISO } from '@/lib/format'
import { num, toValues, useRecordForm } from '@/lib/form'
import type { Sample, StockGrid } from '@/lib/types'
import { byMonth } from './Sales'

export default function Samples() {
  const { data, isLoading } = useList<Sample>('samples')
  const names = useNames()
  const [q, setQ] = useState('')
  const range = useDateRange()
  const [editing, setEditing] = useState<Sample | 'new' | null>(null)

  const shown = useMemo(
    () => (data ?? []).filter((s) => range.inRange(s.date) && matches(q, s.given_to, s.remark, names.name('designs', s.design_id), names.name('people', s.person_id))),
    [data, q, range, names],
  )
  const total = shown.reduce((a, s) => a + s.quantity, 0)
  const perDesign = useMemo(() => {
    const m = new Map<number, number>()
    shown.forEach((s) => m.set(s.design_id, (m.get(s.design_id) ?? 0) + s.quantity))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [shown])

  const exportCsv = () =>
    downloadCsv('samples.csv', ['Date', 'Design', 'Location', 'Quantity', 'Given to', 'Given by', 'Remark'], shown.map((s) => [s.date, names.name('designs', s.design_id), names.name('locations', s.location_id), s.quantity, s.given_to, names.name('people', s.person_id), s.remark]))

  return (
    <Page
      title="Samples"
      subtitle="Free wipes given out as marketing. They reduce stock but never money."
      actions={<><ExportButton onClick={exportCsv} /><AddButton label="New sample" onClick={() => setEditing('new')} /></>}
      toolbar={
        <Toolbar>
          <div className="md:w-72"><SearchField value={q} onChange={setQ} placeholder="Café, design or person" /></div>
          <DateRangePicker state={range} />
        </Toolbar>
      }
    >
      <StatGrid className="lg:grid-cols-2">
        <Stat label="Wipes given" value={`${qty(total)} pcs`} />
        <Stat label="Times given" value={qty(shown.length)} />
      </StatGrid>

      {isLoading ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Empty icon={<Gift className="size-7" />} title={data?.length ? 'No samples match' : 'No samples yet'} body={data?.length ? 'Try a different search.' : 'Record wipes given to cafés and restaurants.'} action={!data?.length && <Button onClick={() => setEditing('new')}>New sample</Button>} />
      ) : (
        <div className="grid gap-x-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {byMonth(shown).map((g) => (
              <Group key={g.key} title={month(g.key)}>
                {g.items.map((s) => (
                  <Row key={s.id} onClick={() => setEditing(s)} title={s.given_to} subtitle={`${date(s.date)} · ${names.name('designs', s.design_id)} · from ${names.name('locations', s.location_id)}`} trailing={`${qty(s.quantity)} pcs`} />
                ))}
              </Group>
            ))}
          </div>
          <div className="lg:col-span-2">
            <Group title="By design">
              {perDesign.map(([id, n]) => (
                <Row key={id} title={names.name('designs', id)} trailing={`${qty(n)} pcs`} />
              ))}
            </Group>
          </div>
        </div>
      )}

      <Editor item={editing} render={(s, open) => <SampleForm sample={s} open={open} onDone={() => setEditing(null)} />} />
    </Page>
  )
}

function SampleForm({ sample, open, onDone }: { sample: Sample | null; open: boolean; onDone: () => void }) {
  const names = useNames()
  const { data: grid } = useReport<StockGrid>('stock')
  const f = useRecordForm(toValues(sample, { date: todayISO(), design_id: '', location_id: '', quantity: '', given_to: '', person_id: '', remark: '' }), {
    table: 'samples',
    saved: sample ? 'Sample updated' : 'Sample saved',
    onDone,
  })
  const v = f.values
  const after = useMemo(() => {
    if (!v.design_id || !v.location_id || !grid) return null
    const d = Number(v.design_id)
    const l = Number(v.location_id)
    let cur = grid.cells.find((c) => c.design_id === d && c.location_id === l)?.qty ?? 0
    if (sample && sample.design_id === d && sample.location_id === l) cur += sample.quantity
    return cur - num(v.quantity)
  }, [v.design_id, v.location_id, v.quantity, grid, sample])

  return (
    <Sheet open={open} onClose={onDone} title={sample ? 'Edit sample' : 'New sample'} onSubmit={() => f.save()} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <FormGrid>
          <Field label="Given to" required>
            <TextInput value={v.given_to} onChange={(e) => f.set('given_to', e.target.value)} placeholder="Café or restaurant" />
          </Field>
          <Field label="Date" required>
            <DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} />
          </Field>
          <MasterSelect table="designs" label="Design" value={v.design_id} onChange={(x) => f.set('design_id', x)} required />
          <MasterSelect table="locations" label="Stock taken from" value={v.location_id} onChange={(x) => f.set('location_id', x)} required />
          <Field label="Pieces" required>
            <NumberInput decimal={false} value={v.quantity} onChange={(x) => f.set('quantity', x)} placeholder="0" />
          </Field>
          <MasterSelect table="people" label="Given by" value={v.person_id} onChange={(x) => f.set('person_id', x)} />
        </FormGrid>
        {after !== null && (after < 0 ? (
          <Notice>Stock at {names.name('locations', Number(v.location_id))} will go to <b className="num">{qty(after)}</b>. You can still save.</Notice>
        ) : (
          <p className="px-1 text-[0.875rem] text-label-2">Stock at {names.name('locations', Number(v.location_id))} after this: <b className="num text-label">{qty(after)}</b></p>
        ))}
        <Field label="Remark">
          <TextArea value={v.remark} onChange={(e) => f.set('remark', e.target.value)} placeholder="Optional" />
        </Field>
        {f.isEdit && <DeleteButton label="Delete sample" onClick={() => f.remove('sample', 'The pieces go back into stock.')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}
