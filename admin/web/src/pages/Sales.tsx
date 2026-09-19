import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import {
  AddButton, DateRangePicker, DeleteButton, Editor, ExportButton, FormError, MasterSelect, Toolbar, downloadCsv, matches, useDateRange,
} from '@/components/common'
import {
  Badge, Button, DateInput, Empty, Field, FormGrid, Group, Loading, Notice, NumberInput, Row, SearchField, Segmented, Select, Stat, StatGrid, TextArea, TextInput,
} from '@/components/ui'
import { useList, useNames, useReport } from '@/lib/data'
import { date, money, month, qty } from '@/lib/format'
import { num, toValues, useRecordForm } from '@/lib/form'
import type { Sale, StockGrid } from '@/lib/types'
import { todayISO } from '@/lib/format'

type Filter = 'all' | 'unpaid' | 'paid'

export function SaleStatus({ s }: { s: Sale }) {
  if (s.status === 'paid') return <Badge tone="green">Paid</Badge>
  return <span className="text-[0.75rem] font-medium text-orange">{money(s.balance)} due</span>
}

/** Groups a newest-first list into month sections. */
export function byMonth<T extends { date: string }>(list: T[]) {
  const groups: { key: string; items: T[] }[] = []
  for (const item of list) {
    const key = item.date.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(item)
    else groups.push({ key, items: [item] })
  }
  return groups
}

export default function SalesPage() {
  const { data: sales, isLoading } = useList<Sale>('sales')
  const names = useNames()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const range = useDateRange()
  const [editing, setEditing] = useState<Sale | 'new' | null>(null)

  const shown = useMemo(
    () =>
      (sales ?? []).filter(
        (s) =>
          range.inRange(s.date) &&
          (filter === 'all' || (filter === 'paid' ? s.status === 'paid' : s.status !== 'paid')) &&
          matches(q, s.party, names.name('designs', s.design_id), names.name('people', s.person_id), s.notes),
      ),
    [sales, q, filter, range, names],
  )
  const totals = useMemo(
    () => ({
      total: shown.reduce((a, s) => a + s.total, 0),
      received: shown.reduce((a, s) => a + s.received, 0),
      due: shown.reduce((a, s) => a + Math.max(0, s.balance), 0),
    }),
    [shown],
  )

  const exportCsv = () =>
    downloadCsv(
      'sales.csv',
      ['Date', 'Customer', 'Design', 'Location', 'Quantity', 'Price per piece', 'Freight', 'Total', 'Received', 'Balance due', 'Status', 'Handled by', 'Notes'],
      shown.map((s) => [s.date, s.party, names.name('designs', s.design_id), names.name('locations', s.location_id), s.quantity, s.price, s.freight, s.total, s.received, s.balance, s.status, names.name('people', s.person_id), s.notes]),
    )

  return (
    <Page
      title="Sales"
      actions={
        <>
          <ExportButton onClick={exportCsv} />
          <AddButton label="New sale" onClick={() => setEditing('new')} />
        </>
      }
      toolbar={
        <Toolbar>
          <div className="md:w-72">
            <SearchField value={q} onChange={setQ} placeholder="Customer, design or person" />
          </div>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'paid', label: 'Paid' },
            ]}
            className="md:w-64"
          />
          <DateRangePicker state={range} />
        </Toolbar>
      }
    >
      <StatGrid className="lg:grid-cols-3">
        <Stat label="Sales" value={money(totals.total)} sub={`${shown.length} ${shown.length === 1 ? 'sale' : 'sales'}`} />
        <Stat label="Money received" value={money(totals.received)} tone="green" />
        <Stat label="Still to collect" value={money(totals.due)} tone={totals.due > 0 ? 'red' : undefined} className="col-span-2 lg:col-span-1" />
      </StatGrid>

      {isLoading ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Empty
          icon={<ShoppingBag className="size-7" />}
          title={sales?.length ? 'No sales match' : 'No sales yet'}
          body={sales?.length ? 'Try a different search or filter.' : 'Record your first sale — stock and money update automatically.'}
          action={!sales?.length && <Button onClick={() => setEditing('new')}>New sale</Button>}
        />
      ) : (
        byMonth(shown).map((g) => (
          <Group key={g.key} title={month(g.key)}>
            {g.items.map((s) => (
              <Row
                key={s.id}
                onClick={() => setEditing(s)}
                title={s.party}
                subtitle={`${date(s.date)} · ${s.design_id ? names.name('designs', s.design_id) : 'No design'} · ${qty(s.quantity)} pcs`}
                trailing={money(s.total)}
                trailingSub={<SaleStatus s={s} />}
              />
            ))}
          </Group>
        ))
      )}

      <SaleSheet sale={editing} onClose={() => setEditing(null)} />
    </Page>
  )
}

export function SaleSheet({ sale, onClose }: { sale: Sale | 'new' | null; onClose: () => void }) {
  return <Editor item={sale} render={(s, open) => <SaleForm sale={s} open={open} onDone={onClose} />} />
}

interface PaymentRow { key: number; date: string; amount: string; account_id: string }

function SaleForm({ sale, open, onDone }: { sale: Sale | null; open: boolean; onDone: () => void }) {
  const names = useNames()
  const navigate = useNavigate()
  const { data: grid } = useReport<StockGrid>('stock')
  const { data: allSales } = useList<Sale>('sales')
  const [payments, setPayments] = useState<PaymentRow[]>(
    (sale?.payments ?? []).map((p, i) => ({ key: i, date: p.date, amount: String(p.amount), account_id: String(p.account_id) })),
  )
  const f = useRecordForm(toValues(sale, { date: todayISO(), party: '', design_id: '', location_id: '', quantity: '', price: '', freight: '', person_id: '', notes: '' }), {
    table: 'sales',
    saved: sale ? 'Sale updated' : 'Sale saved',
    extra: () => ({ payments: payments.map(({ date, amount, account_id }) => ({ date, amount, account_id })) }),
    onDone,
  })
  const v = f.values

  const total = num(v.quantity) * num(v.price) + num(v.freight)
  const received = payments.reduce((a, p) => a + num(p.amount), 0)
  const balance = total - received

  // Stock preview: current stock, adding back this sale's own quantity when editing it.
  const stockAfter = useMemo(() => {
    if (!v.design_id || !v.location_id || !grid) return null
    const d = Number(v.design_id)
    const l = Number(v.location_id)
    let current = grid.cells.find((c) => c.design_id === d && c.location_id === l)?.qty ?? 0
    if (sale && sale.design_id === d && sale.location_id === l) current += sale.quantity
    return current - num(v.quantity)
  }, [v.design_id, v.location_id, v.quantity, grid, sale])

  const parties = useMemo(() => [...new Set((allSales ?? []).map((s) => s.party.trim()))].sort(), [allSales])
  const setPay = (key: number, k: keyof PaymentRow, val: string) => setPayments((ps) => ps.map((p) => (p.key === key ? { ...p, [k]: val } : p)))
  const payMissingAccount = payments.some((p) => num(p.amount) > 0 && !p.account_id)

  const submit = () => (payMissingAccount ? f.setError('Please choose which account each payment went into.') : f.save())

  return (
    <Sheet open={open} onClose={onDone} title={sale ? 'Edit sale' : 'New sale'} onSubmit={submit} busy={f.busy}>
    <div className="space-y-6 pt-1">
      <FormError error={f.error} />

      <FormGrid>
        <Field label="Date" required>
          <DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} />
        </Field>
        <Field label="Customer" required>
          <TextInput value={v.party} onChange={(e) => f.set('party', e.target.value)} list="party-list" placeholder="Who bought it?" autoCapitalize="words" />
          <datalist id="party-list">{parties.map((p) => <option key={p} value={p} />)}</datalist>
        </Field>
        <MasterSelect table="designs" label="Design" value={v.design_id} onChange={(x) => f.set('design_id', x)} />
        <MasterSelect table="locations" label="Stock taken from" value={v.location_id} onChange={(x) => f.set('location_id', x)} />
        <Field label="Quantity (pieces)">
          <NumberInput decimal={false} value={v.quantity} onChange={(x) => f.set('quantity', x)} placeholder="0" />
        </Field>
        <Field label="Price per piece">
          <NumberInput prefix="₹" value={v.price} onChange={(x) => f.set('price', x)} placeholder="0.00" />
        </Field>
        <Field label="Freight">
          <NumberInput prefix="₹" value={v.freight} onChange={(x) => f.set('freight', x)} placeholder="0.00" />
        </Field>
        <MasterSelect table="people" label="Handled by" value={v.person_id} onChange={(x) => f.set('person_id', x)} />
      </FormGrid>

      {stockAfter !== null && (
        stockAfter < 0 ? (
          <Notice>
            Stock of {names.name('designs', Number(v.design_id))} at {names.name('locations', Number(v.location_id))} will go to <b className="num">{qty(stockAfter)}</b>. You can still save.
          </Notice>
        ) : (
          <p className="px-1 text-[0.875rem] text-label-2">
            Stock at {names.name('locations', Number(v.location_id))} after this sale: <b className="num text-label">{qty(stockAfter)}</b>
          </p>
        )
      )}

      {/* Payments */}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-[0.8125rem] font-medium uppercase tracking-[0.04em] text-label-2">Money received</h3>
          <Button
            size="sm"
            variant="tinted"
            icon={<Plus className="size-3.5" strokeWidth={3} />}
            onClick={() => setPayments((ps) => [...ps, { key: Date.now(), date: todayISO(), amount: ps.length === 0 && balance > 0 ? String(Math.round(balance * 100) / 100) : '', account_id: '' }])}
          >
            Add payment
          </Button>
        </div>
        {payments.length === 0 ? (
          <p className="rounded-xl bg-surface-2 px-4 py-3 text-[0.875rem] text-label-2">No money received yet. Add a payment when the customer pays — they can pay in parts.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p, i) => (
              <div key={p.key} className="rounded-xl border border-separator p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.8125rem] font-medium text-label-2">Payment {i + 1}</span>
                  <button type="button" aria-label={`Remove payment ${i + 1}`} className="pressable grid size-7 place-items-center rounded-full text-red hover:bg-red-soft" onClick={() => setPayments((ps) => ps.filter((x) => x.key !== p.key))}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Amount">
                    <NumberInput prefix="₹" value={p.amount} onChange={(x) => setPay(p.key, 'amount', x)} />
                  </Field>
                  <Field label="Received on">
                    <DateInput value={p.date} onChange={(e) => setPay(p.key, 'date', e.target.value)} />
                  </Field>
                  <Field label="Into account" required>
                    <Select value={p.account_id} onChange={(x) => setPay(p.key, 'account_id', x)}>
                      {names.options('accounts', p.account_id ? Number(p.account_id) : null).map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Totals */}
      <div className="overflow-hidden rounded-xl bg-surface-2">
        <SummaryLine label="Total" value={money(total)} hint={total > 0 ? `${qty(num(v.quantity))} × ${money(num(v.price))}${num(v.freight) ? ` + ${money(num(v.freight))} freight` : ''}` : undefined} />
        <SummaryLine label="Received" value={money(received)} />
        <SummaryLine label={balance < 0 ? 'Overpaid' : 'Balance due'} value={money(Math.abs(balance))} strong tone={balance > 0.004 ? 'orange' : balance < -0.004 ? 'red' : 'green'} />
      </div>

      <Field label="Notes">
        <TextArea value={v.notes} onChange={(e) => f.set('notes', e.target.value)} placeholder="Optional" />
      </Field>

      {f.isEdit && sale && (
        <div className="space-y-3">
          <Button variant="gray" size="lg" className="w-full" onClick={() => navigate('/gst', { state: { fromSale: sale } })}>
            Add to GST sales register
          </Button>
          <DeleteButton label="Delete sale" onClick={() => f.remove('sale', 'Stock goes back and the money received is removed from its account.')} disabled={f.busy} />
        </div>
      )}
    </div>
    </Sheet>
  )
}

function SummaryLine({ label, value, hint, strong, tone }: { label: string; value: string; hint?: string; strong?: boolean; tone?: 'orange' | 'red' | 'green' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-separator px-4 py-2.5 last:border-b-0">
      <div>
        <div className={strong ? 'font-semibold' : 'text-label-2'}>{label}</div>
        {hint && <div className="num text-[0.75rem] text-label-3">{hint}</div>}
      </div>
      <div className={`num ${strong ? 'text-[1.125rem] font-semibold' : ''} ${tone === 'orange' ? 'text-orange' : tone === 'red' ? 'text-red' : tone === 'green' ? 'text-green' : ''}`}>{value}</div>
    </div>
  )
}
