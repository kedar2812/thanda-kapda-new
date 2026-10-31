import { useMemo, useState } from 'react'
import { ReceiptIndianRupee } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { AddButton, DeleteButton, Editor, ExportButton, FormError, Toolbar, downloadCsv, matches } from '@/components/common'
import { Badge, Button, DateInput, Empty, Field, FormGrid, Group, Loading, Notice, NumberInput, Row, SearchField, Segmented, Stat, StatGrid, TextArea, TextInput } from '@/components/ui'
import { useList, useReport } from '@/lib/data'
import { date, money, month, todayISO } from '@/lib/format'
import { num, toValues, useRecordForm } from '@/lib/form'
import type { GstEntry, GstMonth } from '@/lib/types'

type Tab = 'summary' | 'purchases' | 'sales'
type Kind = 'purchases' | 'sales'
type PaidFilter = 'all' | 'paid' | 'unpaid'

const table = (k: Kind) => (k === 'purchases' ? 'gst_purchases' : 'gst_sales')
const who = (e: GstEntry) => e.supplier ?? e.party ?? ''

const isPaid = (e: GstEntry) => e.paid === 'Paid'

interface Editing { id: number; kind: Kind; entry: GstEntry | 'new' }

export default function Gst() {
  const [tab, setTab] = useState<Tab>('summary')
  const [editing, setEditing] = useState<Editing | null>(null)
  const open = (kind: Kind, entry: GstEntry | 'new') => setEditing({ id: entry === 'new' ? -1 : entry.id, kind, entry })

  return (
    <Page
      title="GST"
      subtitle="Registers for GST paid on purchases and collected on sales. They don’t change stock or balances."
      actions={tab !== 'summary' && <AddButton label={tab === 'purchases' ? 'New purchase' : 'New sale'} onClick={() => open(tab, 'new')} />}
      toolbar={
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'summary', label: 'Monthly summary' },
            { value: 'purchases', label: 'Purchases' },
            { value: 'sales', label: 'Sales' },
          ]}
          className="md:w-[26rem]"
        />
      }
    >
      {tab === 'summary' && <Summary />}
      {tab !== 'summary' && <Register kind={tab} onOpen={(entry) => open(tab, entry)} />}
      <Editor
        item={editing}
        render={(e, open) => e && <GstForm kind={e.kind} entry={e.entry === 'new' ? null : e.entry} open={open} onDone={() => setEditing(null)} />}
      />
    </Page>
  )
}

function Summary() {
  const { data, isLoading } = useReport<GstMonth[]>('gst')
  if (isLoading) return <Loading />
  if (!data?.length) return <Empty icon={<ReceiptIndianRupee className="size-7" />} title="No GST entries yet" body="Add purchase and sales invoices to see what’s payable each month." />
  const totals = data.reduce((a, m) => ({ output: a.output + m.output, input: a.input + m.input }), { output: 0, input: 0 })
  return (
    <>
      <StatGrid className="lg:grid-cols-3">
        <Stat label="GST collected (output)" value={money(totals.output)} />
        <Stat label="GST paid (input credit)" value={money(totals.input)} />
        <Stat label={totals.output - totals.input >= 0 ? 'Net payable' : 'Net credit'} value={money(Math.abs(totals.output - totals.input))} tone={totals.output - totals.input > 0 ? 'red' : 'green'} className="col-span-2 lg:col-span-1" />
      </StatGrid>
      <Group title="By month" footer="Net payable = GST collected on sales − GST paid on purchases.">
        {data.map((m) => (
          <Row
            key={m.month}
            title={month(m.month)}
            subtitle={`Collected ${money(m.output)} · Paid ${money(m.input)}`}
            trailing={<span className={m.net > 0 ? 'text-red' : 'text-green'}>{money(Math.abs(m.net))}</span>}
            trailingSub={m.net >= 0 ? 'to pay' : 'credit'}
          />
        ))}
      </Group>
    </>
  )
}

function Register({ kind, onOpen }: { kind: Kind; onOpen: (e: GstEntry) => void }) {
  const { data, isLoading } = useList<GstEntry>(table(kind))
  const [q, setQ] = useState('')
  const [m, setM] = useState('')
  const [paid, setPaid] = useState<PaidFilter>('all')
  const months = useMemo(() => [...new Set((data ?? []).map((e) => e.date.slice(0, 7)))], [data])
  const shown = useMemo(
    () => (data ?? []).filter((e) => (!m || e.date.startsWith(m)) && (paid === 'all' || (paid === 'paid') === isPaid(e)) && matches(q, who(e), e.gstin, e.invoice_no, e.remarks)),
    [data, q, m, paid],
  )
  const label = kind === 'purchases' ? 'Supplier' : 'Party'
  const pending = shown.filter((e) => !isPaid(e)).reduce((a, e) => a + e.total, 0)

  const exportCsv = () =>
    downloadCsv(`gst-${kind}.csv`, ['Date', label, 'GSTIN', 'Invoice no.', 'Taxable value', 'GST', 'Total', kind === 'purchases' ? 'Bill status' : 'Status', 'Remarks'], shown.map((e) => [e.date, who(e), e.gstin, e.invoice_no, e.taxable, e.gst, e.total, e.paid, e.remarks]))

  return (
    <>
      <Toolbar className="mb-5">
        <div className="md:w-72"><SearchField value={q} onChange={setQ} placeholder={`${label}, GSTIN, invoice, remarks`} /></div>
        <Segmented<PaidFilter> value={paid} onChange={setPaid} options={[{ value: 'all', label: 'All' }, { value: 'paid', label: 'Paid' }, { value: 'unpaid', label: kind === 'purchases' ? 'Pending' : 'Unpaid' }]} className="md:w-64" />
        <select aria-label="Month" value={m} onChange={(e) => setM(e.target.value)} className="h-9 appearance-none rounded-[0.625rem] bg-fill px-3 text-[0.875rem] font-medium outline-none">
          <option value="">All months</option>
          {months.map((x) => <option key={x} value={x}>{month(x)}</option>)}
        </select>
        <div className="md:ml-auto"><ExportButton onClick={exportCsv} /></div>
      </Toolbar>
      <StatGrid>
        <Stat label="Entries" value={shown.length} />
        <Stat label="Taxable value" value={money(shown.reduce((a, e) => a + e.taxable, 0))} />
        <Stat label={kind === 'purchases' ? 'GST paid (input)' : 'GST collected (output)'} value={money(shown.reduce((a, e) => a + e.gst, 0))} />
        <Stat label={kind === 'purchases' ? 'Pending to suppliers' : 'Not yet received'} value={money(pending)} tone={pending > 0.004 ? 'red' : 'green'} />
      </StatGrid>
      {isLoading ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Empty icon={<ReceiptIndianRupee className="size-7" />} title={data?.length ? 'Nothing matches' : 'No entries yet'} />
      ) : (
        <Group>
          {shown.map((e) => (
            <Row
              key={e.id}
              onClick={() => onOpen(e)}
              title={<>{who(e)} {e.auto && <Badge tone="accent">Auto</Badge>}</>}
              subtitle={`${date(e.date)}${e.invoice_no ? ` · Inv ${e.invoice_no}` : ''}${e.gstin ? ` · ${e.gstin}` : ''}${e.remarks ? ` · ${e.remarks}` : ''}`}
              trailing={money(e.total)}
              trailingSub={isPaid(e) ? `GST ${money(e.gst)}` : <span className="font-medium text-orange">{kind === 'purchases' ? 'Bill pending' : 'Unpaid'}</span>}
            />
          ))}
        </Group>
      )}
    </>
  )
}

function GstForm({ kind, entry, open, onDone }: { kind: Kind; entry: GstEntry | null; open: boolean; onDone: () => void }) {
  const nameKey = kind === 'purchases' ? 'supplier' : 'party'
  const f = useRecordForm(
    toValues(entry, {
      date: todayISO(),
      [nameKey]: '',
      gstin: '',
      invoice_no: '',
      taxable: '',
      gst: '',
      total: '',
      remarks: '',
      ...(kind === 'purchases' ? { paid: 'Pending' } : { sale_id: '' }),
    }),
    { table: table(kind), saved: entry ? 'Entry updated' : 'Entry saved', onDone },
  )
  const v = f.values
  const locked = Boolean(entry?.auto)
  const source = entry?.amazon_order_id ? 'Amazon order' : 'sale'

  const setPart = (k: 'taxable' | 'gst', x: string) => {
    const autoTotal = num(v.taxable) + num(v.gst)
    f.set(k, x)
    if (v.total === '' || Math.abs(num(v.total) - autoTotal) < 0.005) {
      const next = k === 'taxable' ? num(x) + num(v.gst) : num(v.taxable) + num(x)
      f.set('total', next ? String(Math.round(next * 100) / 100) : '')
    }
  }
  /** Split an amount that includes GST at the given rate into taxable + GST. */
  const split = (rate: number) => {
    const total = num(v.total) || num(v.taxable) + num(v.gst)
    if (!total) return
    const taxable = Math.round((total / (1 + rate / 100)) * 100) / 100
    f.set('taxable', String(taxable))
    f.set('gst', String(Math.round((total - taxable) * 100) / 100))
    f.set('total', String(total))
  }

  return (
    <Sheet open={open} onClose={onDone} title={`${locked ? '' : entry ? 'Edit ' : 'New '}GST ${kind === 'purchases' ? 'purchase' : 'sale'}`} onSubmit={locked ? undefined : () => f.save()} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        {locked && <Notice tone="accent">This line comes from a {source} and follows it. To change it, edit the {source}.</Notice>}
        <fieldset disabled={locked} className="space-y-5">
        {kind === 'purchases' && (
          <Segmented value={v.paid} onChange={(x) => f.set('paid', x)} options={[{ value: 'Pending', label: 'Bill pending' }, { value: 'Paid', label: 'Bill paid' }]} />
        )}
        <FormGrid>
          <Field label={kind === 'purchases' ? 'Supplier' : 'Party'} required><TextInput value={v[nameKey]} onChange={(e) => f.set(nameKey, e.target.value)} /></Field>
          <Field label="Date" required><DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} /></Field>
          <Field label={`${kind === 'purchases' ? 'Supplier' : 'Party'} GSTIN`}><TextInput value={v.gstin} onChange={(e) => f.set('gstin', e.target.value.toUpperCase())} placeholder="Optional" className="num uppercase" maxLength={15} /></Field>
          <Field label="Invoice no."><TextInput value={v.invoice_no} onChange={(e) => f.set('invoice_no', e.target.value)} /></Field>
          <Field label="Taxable value"><NumberInput prefix="₹" value={v.taxable} onChange={(x) => setPart('taxable', x)} placeholder="0.00" /></Field>
          <Field label="GST amount"><NumberInput prefix="₹" value={v.gst} onChange={(x) => setPart('gst', x)} placeholder="0.00" /></Field>
          <Field label="Total" hint="Taxable + GST, filled in for you. You can change it."><NumberInput prefix="₹" value={v.total} onChange={(x) => f.set('total', x)} placeholder="0.00" /></Field>
        </FormGrid>
        {!locked && (
          <div>
            <p className="mb-2 px-1 text-[0.8125rem] text-label-2">Only know the total? Split it at a GST rate:</p>
            <div className="flex gap-2">
              {[5, 12, 18, 28].map((r) => <Button key={r} size="sm" variant="gray" onClick={() => split(r)}>{r}%</Button>)}
            </div>
          </div>
        )}
        <Field label="Remarks">
          <TextArea value={v.remarks} onChange={(e) => f.set('remarks', e.target.value)} placeholder="Optional" />
        </Field>
        </fieldset>
        {f.isEdit && !locked && <DeleteButton label="Delete entry" onClick={() => f.remove('entry', 'This only removes it from the GST register.')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}
