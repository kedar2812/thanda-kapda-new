import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileUp, Package, Wallet } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { AddButton, DateRangePicker, DeleteButton, Editor, ExportButton, FormError, MasterSelect, Toolbar, downloadCsv, matches, useDateRange } from '@/components/common'
import { Badge, Button, DateInput, Empty, Field, FormGrid, Group, IconButton, Loading, Notice, NumberInput, Row, SearchField, Segmented, Stat, StatGrid, TextArea, TextInput, useToast } from '@/components/ui'
import { post } from '@/lib/api'
import { useList, useNames } from '@/lib/data'
import { date, money, month, plural, qty, todayISO } from '@/lib/format'
import { num, toValues, useRecordForm } from '@/lib/form'
import type { AmazonOrder, AmazonSettlement } from '@/lib/types'
import { byMonth } from './Sales'

type Tab = 'orders' | 'payouts'
type StatusFilter = 'all' | 'Shipment' | 'Cancel' | 'Refund'

const statusTone = { Shipment: 'green', Cancel: 'gray', Refund: 'orange' } as const

export default function Amazon() {
  const [tab, setTab] = useState<Tab>('orders')
  const [order, setOrder] = useState<AmazonOrder | 'new' | null>(null)
  const [payout, setPayout] = useState<AmazonSettlement | 'new' | null>(null)
  const [importing, setImporting] = useState(false)

  return (
    <Page
      title="Amazon"
      actions={
        tab === 'orders' ? (
          <>
            <IconButton label="Import Amazon report (CSV)" onClick={() => setImporting(true)}>
              <FileUp className="size-5" strokeWidth={2.2} />
            </IconButton>
            <AddButton label="New order" onClick={() => setOrder('new')} />
          </>
        ) : (
          <AddButton label="New payout" onClick={() => setPayout('new')} />
        )
      }
      toolbar={<Segmented<Tab> value={tab} onChange={setTab} options={[{ value: 'orders', label: 'Orders' }, { value: 'payouts', label: 'Payouts' }]} className="md:w-64" />}
    >
      {tab === 'orders' ? <Orders onOpen={setOrder} onNew={() => setOrder('new')} /> : <Payouts onOpen={setPayout} />}
      <Editor item={order} render={(o, open) => <OrderForm order={o} open={open} onDone={() => setOrder(null)} />} />
      <Editor item={payout} render={(p, open) => <PayoutForm payout={p} open={open} onDone={() => setPayout(null)} />} />
      <ImportSheet open={importing} onClose={() => setImporting(false)} />
    </Page>
  )
}

function Orders({ onOpen, onNew }: { onOpen: (o: AmazonOrder) => void; onNew: () => void }) {
  const { data, isLoading } = useList<AmazonOrder>('amazon_orders')
  const names = useNames()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const range = useDateRange()

  const inRange = useMemo(() => (data ?? []).filter((o) => range.inRange(o.date) && matches(q, o.order_id, o.customer, o.city, o.invoice_no, names.name('designs', o.design_id))), [data, q, range, names])
  const shown = inRange.filter((o) => status === 'all' || o.status === status)
  const shipped = inRange.filter((o) => o.status === 'Shipment')

  const exportCsv = () =>
    downloadCsv('amazon-orders.csv', ['Date', 'Order ID', 'Customer', 'City', 'Status', 'Invoice no.', 'Design', 'Location', 'Quantity', 'Taxable value', 'Total tax', 'Invoice amount'], shown.map((o) => [o.date, o.order_id, o.customer, o.city, o.status, o.invoice_no, names.name('designs', o.design_id), names.name('locations', o.location_id), o.quantity, o.taxable, o.tax, o.invoice_amount]))

  return (
    <>
      <Toolbar className="mb-5">
        <div className="md:w-72"><SearchField value={q} onChange={setQ} placeholder="Order ID, customer, city" /></div>
        <Segmented<StatusFilter> value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'Shipment', label: 'Shipped' }, { value: 'Cancel', label: 'Cancelled' }, { value: 'Refund', label: 'Refunded' }]} className="md:w-96" />
        <DateRangePicker state={range} />
        <div className="md:ml-auto"><ExportButton onClick={exportCsv} /></div>
      </Toolbar>
      <StatGrid>
        <Stat label="Orders" value={qty(inRange.length)} />
        <Stat label="Shipped" value={qty(shipped.length)} />
        <Stat label="Net revenue" value={money(shipped.reduce((a, o) => a + o.invoice_amount, 0))} tone="green" sub="Invoice amount, shipped only" />
        <Stat label="Tax on shipped" value={money(shipped.reduce((a, o) => a + o.tax, 0))} />
      </StatGrid>
      {isLoading ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Empty icon={<Package className="size-7" />} title={data?.length ? 'No orders match' : 'No Amazon orders yet'} body={data?.length ? 'Try a different search or filter.' : 'Add orders one by one, or import Amazon’s report file.'} action={!data?.length && <Button onClick={onNew}>New order</Button>} />
      ) : (
        byMonth(shown).map((g) => (
          <Group key={g.key} title={month(g.key)}>
            {g.items.map((o) => (
              <Row
                key={o.id}
                onClick={() => onOpen(o)}
                title={<span className="num">{o.order_id}</span>}
                subtitle={`${date(o.date)} · ${o.customer || 'Customer'}${o.city ? `, ${o.city}` : ''} · ${o.design_id ? names.name('designs', o.design_id) : 'No design'} × ${qty(o.quantity)}`}
                trailing={money(o.invoice_amount)}
                trailingSub={<Badge tone={statusTone[o.status]}>{o.status === 'Shipment' ? 'Shipped' : o.status === 'Cancel' ? 'Cancelled' : 'Refunded'}</Badge>}
              />
            ))}
          </Group>
        ))
      )}
    </>
  )
}

function Payouts({ onOpen }: { onOpen: (p: AmazonSettlement) => void }) {
  const { data, isLoading } = useList<AmazonSettlement>('amazon_settlements')
  const names = useNames()
  if (isLoading) return <Loading />
  const total = (data ?? []).reduce((a, p) => a + p.amount, 0)
  const fees = (data ?? []).reduce((a, p) => a + p.fees, 0)
  return (
    <>
      <p className="mb-4 px-1 text-[0.875rem] text-label-2">Amazon pays out in batches. Record each payout here — it adds the money to an account, and its fees count against profit.</p>
      <StatGrid className="lg:grid-cols-2">
        <Stat label="Received from Amazon" value={money(total)} tone="green" />
        <Stat label="Amazon fees" value={money(fees)} />
      </StatGrid>
      {!data?.length ? (
        <Empty icon={<Wallet className="size-7" />} title="No payouts yet" body="Add one each time Amazon sends money." />
      ) : (
        <Group>
          {data.map((p) => (
            <Row key={p.id} onClick={() => onOpen(p)} title={`Into ${names.name('accounts', p.account_id)}`} subtitle={`${date(p.date)}${p.reference ? ` · ${p.reference}` : ''}${p.fees ? ` · fees ${money(p.fees)}` : ''}`} trailing={money(p.amount)} />
          ))}
        </Group>
      )}
    </>
  )
}

function OrderForm({ order, open, onDone }: { order: AmazonOrder | null; open: boolean; onDone: () => void }) {
  const f = useRecordForm(toValues(order, { date: todayISO(), order_id: '', customer: '', city: '', status: 'Shipment', invoice_no: '', design_id: '', location_id: '', quantity: '', taxable: '', tax: '', invoice_amount: '' }), {
    table: 'amazon_orders',
    saved: order ? 'Order updated' : 'Order saved',
    onDone,
  })
  const v = f.values
  const setTaxable = (k: 'taxable' | 'tax', x: string) => {
    const autoTotal = num(v.taxable) + num(v.tax)
    f.set(k, x)
    // Keep invoice amount in step while it still equals taxable + tax.
    if (v.invoice_amount === '' || Math.abs(num(v.invoice_amount) - autoTotal) < 0.005) {
      const next = (k === 'taxable' ? num(x) + num(v.tax) : num(v.taxable) + num(x))
      f.set('invoice_amount', next ? String(Math.round(next * 100) / 100) : '')
    }
  }
  return (
    <Sheet open={open} onClose={onDone} title={order ? 'Edit order' : 'New Amazon order'} onSubmit={() => f.save()} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <Segmented value={v.status} onChange={(x) => f.set('status', x)} options={[{ value: 'Shipment', label: 'Shipped' }, { value: 'Cancel', label: 'Cancelled' }, { value: 'Refund', label: 'Refunded' }]} />
        {v.status !== 'Shipment' && <p className="px-1 text-[0.8125rem] text-label-2">Cancelled and refunded orders don’t take stock.</p>}
        <FormGrid>
          <Field label="Order ID" required><TextInput value={v.order_id} onChange={(e) => f.set('order_id', e.target.value)} placeholder="408-1234567-1234567" className="num" /></Field>
          <Field label="Date" required><DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} /></Field>
          <Field label="Customer"><TextInput value={v.customer} onChange={(e) => f.set('customer', e.target.value)} /></Field>
          <Field label="City"><TextInput value={v.city} onChange={(e) => f.set('city', e.target.value)} /></Field>
          <MasterSelect table="designs" label="Design" value={v.design_id} onChange={(x) => f.set('design_id', x)} />
          <MasterSelect table="locations" label="Shipped from" value={v.location_id} onChange={(x) => f.set('location_id', x)} />
          <Field label="Quantity"><NumberInput decimal={false} value={v.quantity} onChange={(x) => f.set('quantity', x)} placeholder="0" /></Field>
          <Field label="Invoice no."><TextInput value={v.invoice_no} onChange={(e) => f.set('invoice_no', e.target.value)} /></Field>
          <Field label="Taxable value"><NumberInput prefix="₹" value={v.taxable} onChange={(x) => setTaxable('taxable', x)} placeholder="0.00" /></Field>
          <Field label="Total tax"><NumberInput prefix="₹" value={v.tax} onChange={(x) => setTaxable('tax', x)} placeholder="0.00" /></Field>
          <Field label="Invoice amount" hint="Fills in from taxable value + tax; you can change it."><NumberInput prefix="₹" value={v.invoice_amount} onChange={(x) => f.set('invoice_amount', x)} placeholder="0.00" /></Field>
        </FormGrid>
        {f.isEdit && <DeleteButton label="Delete order" onClick={() => f.remove('order')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}

function PayoutForm({ payout, open, onDone }: { payout: AmazonSettlement | null; open: boolean; onDone: () => void }) {
  const f = useRecordForm(toValues(payout, { date: todayISO(), account_id: '', amount: '', fees: '', reference: '', note: '' }), {
    table: 'amazon_settlements',
    saved: payout ? 'Payout updated' : 'Payout saved',
    onDone,
  })
  const v = f.values
  return (
    <Sheet open={open} onClose={onDone} title={payout ? 'Edit payout' : 'New Amazon payout'} onSubmit={() => f.save()} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <FormGrid>
          <Field label="Amount received" required><NumberInput prefix="₹" value={v.amount} onChange={(x) => f.set('amount', x)} placeholder="0.00" /></Field>
          <MasterSelect table="accounts" label="Received into" value={v.account_id} onChange={(x) => f.set('account_id', x)} required />
          <Field label="Amazon fees deducted"><NumberInput prefix="₹" value={v.fees} onChange={(x) => f.set('fees', x)} placeholder="0.00" /></Field>
          <Field label="Date" required><DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} /></Field>
          <Field label="Reference" className="sm:col-span-2"><TextInput value={v.reference} onChange={(e) => f.set('reference', e.target.value)} placeholder="Settlement ID (optional)" /></Field>
        </FormGrid>
        <Field label="Note"><TextArea value={v.note} onChange={(e) => f.set('note', e.target.value)} placeholder="Optional" /></Field>
        {f.isEdit && <DeleteButton label="Delete payout" onClick={() => f.remove('payout')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------- CSV import

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const delim = (text.split('\n')[0].match(/\t/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? '\t' : ','
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === delim) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => x.trim()))
}

// Column name candidates found in Amazon's order and tax (MTR) reports.
const COLUMNS: Record<string, string[]> = {
  order_id: ['order id', 'amazon-order-id', 'order-id', 'orderid'],
  date: ['invoice date', 'order date', 'purchase-date', 'shipment date', 'date'],
  customer: ['buyer name', 'buyer-name', 'customer name', 'recipient-name', 'ship to name'],
  city: ['ship to city', 'ship-city', 'shipping city', 'city'],
  status: ['transaction type', 'order-status', 'order status', 'status'],
  invoice_no: ['invoice number', 'invoice no', 'invoice-number'],
  quantity: ['quantity', 'quantity-purchased', 'qty', 'quantity-shipped'],
  taxable: ['tax exclusive gross', 'taxable value', 'principal amount basis', 'item-price-excl-tax'],
  tax: ['total tax amount', 'total tax', 'tax', 'item-tax'],
  invoice_amount: ['invoice amount', 'item-price', 'total amount', 'amount'],
}

function toIsoDate(s: string): string {
  const t = s.trim()
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/) // Indian day-first
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(t)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

function toStatus(s: string): AmazonOrder['status'] {
  const t = s.toLowerCase()
  if (t.includes('cancel')) return 'Cancel'
  if (t.includes('refund') || t.includes('return')) return 'Refund'
  return 'Shipment'
}

function ImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const names = useNames()
  const qc = useQueryClient()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<string>('')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [found, setFound] = useState<string[]>([])
  const [designId, setDesignId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ added: number; skipped: string[] } | null>(null)

  const reset = () => { setFile(''); setRows([]); setFound([]); setError(null); setResult(null) }
  const close = () => { reset(); onClose() }

  async function read(f: File) {
    reset()
    setFile(f.name)
    const table = parseCsv(await f.text())
    if (table.length < 2) return setError('That file has no rows.')
    const header = table[0].map((h) => h.trim().toLowerCase().replace(/^﻿/, ''))
    const idx: Record<string, number> = {}
    for (const [field, candidates] of Object.entries(COLUMNS)) {
      const i = candidates.map((c) => header.indexOf(c)).find((x) => x >= 0)
      if (i !== undefined) idx[field] = i
    }
    if (idx.order_id === undefined || idx.date === undefined) return setError('Could not find “Order Id” and a date column. Please use Amazon’s order report or tax (MTR) report.')
    setFound(Object.keys(idx))
    setRows(
      table.slice(1).map((r) => {
        const get = (k: string) => (idx[k] !== undefined ? (r[idx[k]] ?? '').trim() : '')
        const numStr = (k: string) => get(k).replace(/[₹,\s]/g, '')
        const taxable = numStr('taxable')
        const tax = numStr('tax')
        return {
          order_id: get('order_id'),
          date: toIsoDate(get('date')),
          customer: get('customer'),
          city: get('city'),
          status: toStatus(get('status')),
          invoice_no: get('invoice_no'),
          quantity: String(Math.abs(Math.round(Number(numStr('quantity') || 0)))),
          taxable: String(Math.abs(Number(taxable || 0))),
          tax: String(Math.abs(Number(tax || 0))),
          invoice_amount: String(Math.abs(Number(numStr('invoice_amount') || Number(taxable || 0) + Number(tax || 0)))),
        }
      }).filter((r) => r.order_id),
    )
  }

  async function doImport() {
    setBusy(true)
    setError(null)
    try {
      const res = await post<{ added: number; skipped: string[] }>('amazon_orders/import', { rows: rows.map((r) => ({ ...r, design_id: designId, location_id: locationId })) })
      await qc.invalidateQueries()
      setResult(res)
      toast(`${plural(res.added, 'order')} imported`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Import Amazon orders">
      <div className="space-y-5 pt-1">
        {error && <Notice tone="red">{error}</Notice>}
        {result ? (
          <>
            <Notice tone="accent">{plural(result.added, 'order')} added.{result.skipped.length > 0 && ` ${plural(result.skipped.length, 'row')} skipped.`}</Notice>
            {result.skipped.length > 0 && (
              <Group title="Skipped">
                {result.skipped.slice(0, 50).map((s, i) => <Row key={i} title={s} tone="muted" />)}
              </Group>
            )}
            <Button size="lg" className="w-full" onClick={close}>Done</Button>
          </>
        ) : (
          <>
            <p className="px-1 text-[0.875rem] text-label-2">
              In Seller Central, download the <b>order report</b> or <b>tax report (MTR)</b> as CSV, then choose it here. Orders already in the list are skipped.
            </p>
            <input ref={input} type="file" accept=".csv,.txt,.tsv,text/csv" hidden onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} />
            <Button variant="tinted" size="lg" className="w-full" icon={<FileUp className="size-5" />} onClick={() => input.current?.click()}>
              {file || 'Choose file'}
            </Button>
            {rows.length > 0 && (
              <>
                <Notice tone="accent">Found {plural(rows.length, 'order')}. Columns matched: {found.join(', ').replace(/_/g, ' ')}.</Notice>
                <p className="px-1 text-[0.875rem] text-label-2">Amazon reports don’t say which design or which location the stock left from. Choose them to apply to every imported order (you can edit single orders later).</p>
                <FormGrid>
                  <MasterSelect table="designs" label="Design for all rows" value={designId} onChange={setDesignId} placeholder="Leave blank" />
                  <MasterSelect table="locations" label="Shipped from" value={locationId} onChange={setLocationId} placeholder="Leave blank" />
                </FormGrid>
                {(!designId || !locationId) && <p className="px-1 text-[0.8125rem] text-orange">Without a design and location, these orders won’t reduce stock.</p>}
                <Group title="Preview">
                  {rows.slice(0, 5).map((r, i) => (
                    <Row key={i} title={<span className="num">{r.order_id}</span>} subtitle={`${date(r.date)} · ${r.status} · qty ${r.quantity}${designId ? ` · ${names.name('designs', Number(designId))}` : ''}`} trailing={money(Number(r.invoice_amount))} />
                  ))}
                </Group>
                <Button size="lg" className="w-full" disabled={busy} onClick={doImport}>
                  {busy ? 'Importing…' : `Import ${plural(rows.length, 'order')}`}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}

