import { useMemo, useState } from 'react'
import { Receipt } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { AddButton, DateRangePicker, DeleteButton, Editor, ExportButton, FormError, MasterSelect, Toolbar, downloadCsv, matches, useDateRange } from '@/components/common'
import { Button, DateInput, Empty, Field, FormGrid, Group, Loading, NumberInput, Row, SearchField, Stat, StatGrid, TextArea, TextInput } from '@/components/ui'
import { useList, useNames } from '@/lib/data'
import { date, money, month, todayISO } from '@/lib/format'
import { toValues, useRecordForm } from '@/lib/form'
import type { Expense } from '@/lib/types'
import { byMonth } from './Sales'

export default function Expenses() {
  const { data, isLoading } = useList<Expense>('expenses')
  const names = useNames()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const range = useDateRange()
  const [editing, setEditing] = useState<Expense | 'new' | null>(null)

  const shown = useMemo(
    () =>
      (data ?? []).filter(
        (e) => range.inRange(e.date) && (!category || e.category_id === Number(category)) && matches(q, e.paid_to, e.remarks, names.name('categories', e.category_id), names.name('people', e.person_id)),
      ),
    [data, q, category, range, names],
  )
  const total = shown.reduce((a, e) => a + e.amount, 0)
  const byCategory = useMemo(() => {
    const m = new Map<number, number>()
    shown.forEach((e) => m.set(e.category_id, (m.get(e.category_id) ?? 0) + e.amount))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [shown])

  const exportCsv = () =>
    downloadCsv('expenses.csv', ['Date', 'Paid to', 'Amount', 'Category', 'Paid from', 'Paid by', 'Remarks'], shown.map((e) => [e.date, e.paid_to, e.amount, names.name('categories', e.category_id), names.name('accounts', e.account_id), names.name('people', e.person_id), e.remarks]))

  return (
    <Page
      title="Expenses"
      actions={<><ExportButton onClick={exportCsv} /><AddButton label="New expense" onClick={() => setEditing('new')} /></>}
      toolbar={
        <Toolbar>
          <div className="md:w-72"><SearchField value={q} onChange={setQ} placeholder="Paid to, remarks, person" /></div>
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 appearance-none rounded-[0.625rem] bg-fill px-3 text-[0.875rem] font-medium outline-none">
            <option value="">All categories</option>
            {names.masters.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <DateRangePicker state={range} />
        </Toolbar>
      }
    >
      <StatGrid className="lg:grid-cols-2">
        <Stat label="Total spent" value={money(total)} />
        <Stat label="Entries" value={shown.length} />
      </StatGrid>

      {isLoading ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Empty icon={<Receipt className="size-7" />} title={data?.length ? 'No expenses match' : 'No expenses yet'} body={data?.length ? 'Try a different search or filter.' : 'Record money spent — the account balance updates automatically.'} action={!data?.length && <Button onClick={() => setEditing('new')}>New expense</Button>} />
      ) : (
        <div className="grid gap-x-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {byMonth(shown).map((g) => (
              <Group key={g.key} title={month(g.key)}>
                {g.items.map((e) => (
                  <Row key={e.id} onClick={() => setEditing(e)} title={e.paid_to} subtitle={`${date(e.date)} · ${names.name('categories', e.category_id)} · from ${names.name('accounts', e.account_id)}`} trailing={money(e.amount)} />
                ))}
              </Group>
            ))}
          </div>
          <div className="lg:col-span-2">
            <Group title="By category">
              {byCategory.map(([id, amt]) => (
                <Row
                  key={id}
                  title={names.name('categories', id)}
                  subtitle={
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-fill">
                      <span className="block h-full rounded-full bg-series-2" style={{ width: `${Math.max(2, (amt / total) * 100)}%` }} />
                    </span>
                  }
                  trailing={money(amt)}
                  trailingSub={`${Math.round((amt / total) * 100)}%`}
                  onClick={() => setCategory(String(id))}
                  chevron={false}
                />
              ))}
            </Group>
          </div>
        </div>
      )}

      <Editor item={editing} render={(e, open) => <ExpenseForm expense={e} open={open} onDone={() => setEditing(null)} />} />
    </Page>
  )
}

function ExpenseForm({ expense, open, onDone }: { expense: Expense | null; open: boolean; onDone: () => void }) {
  const { data: all } = useList<Expense>('expenses')
  const payees = useMemo(() => [...new Set((all ?? []).map((e) => e.paid_to.trim()))].sort(), [all])
  const f = useRecordForm(toValues(expense, { date: todayISO(), paid_to: '', amount: '', category_id: '', account_id: '', person_id: '', remarks: '' }), {
    table: 'expenses',
    saved: expense ? 'Expense updated' : 'Expense saved',
    onDone,
  })
  const v = f.values
  return (
    <Sheet open={open} onClose={onDone} title={expense ? 'Edit expense' : 'New expense'} onSubmit={() => f.save()} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <FormGrid>
          <Field label="Amount" required>
            <NumberInput prefix="₹" value={v.amount} onChange={(x) => f.set('amount', x)} placeholder="0.00" autoFocus />
          </Field>
          <Field label="Date" required>
            <DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} />
          </Field>
          <Field label="Paid to" required>
            <TextInput value={v.paid_to} onChange={(e) => f.set('paid_to', e.target.value)} list="payee-list" placeholder="Who was paid?" />
            <datalist id="payee-list">{payees.map((p) => <option key={p} value={p} />)}</datalist>
          </Field>
          <MasterSelect table="categories" label="Category" value={v.category_id} onChange={(x) => f.set('category_id', x)} required />
          <MasterSelect table="accounts" label="Paid from account" value={v.account_id} onChange={(x) => f.set('account_id', x)} required />
          <MasterSelect table="people" label="Paid by" value={v.person_id} onChange={(x) => f.set('person_id', x)} />
        </FormGrid>
        <Field label="Remarks">
          <TextArea value={v.remarks} onChange={(e) => f.set('remarks', e.target.value)} placeholder="Optional" />
        </Field>
        {f.isEdit && <DeleteButton label="Delete expense" onClick={() => f.remove('expense', 'The money goes back into the account balance.')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}
