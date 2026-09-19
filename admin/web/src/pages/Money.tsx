import { useState } from 'react'
import { ArrowRightLeft, PlusCircle, Wallet } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { DeleteButton, Editor, ExportButton, FormError, MasterSelect, downloadCsv } from '@/components/common'
import { Button, DateInput, Empty, Field, FormGrid, Group, Loading, NumberInput, Row, Segmented, Select, TextArea } from '@/components/ui'
import { useList, useNames, useReport } from '@/lib/data'
import { date, money, todayISO } from '@/lib/format'
import { toValues, useRecordForm } from '@/lib/form'
import type { AccountEntry, AccountTransfer, Balances, StatementLine } from '@/lib/types'

const KINDS: { value: AccountEntry['kind']; label: string; direction?: 'in' | 'out' }[] = [
  { value: 'opening', label: 'Opening balance', direction: 'in' },
  { value: 'capital', label: 'Capital put in by a partner', direction: 'in' },
  { value: 'withdrawal', label: 'Withdrawal by a partner', direction: 'out' },
  { value: 'correction', label: 'Correction' },
  { value: 'other', label: 'Other' },
]
const kindLabel = (k: string) => KINDS.find((x) => x.value === k)?.label ?? k

type Tab = 'accounts' | 'adjustments' | 'transfers'

export default function Money() {
  const [tab, setTab] = useState<Tab>('accounts')
  const [entry, setEntry] = useState<AccountEntry | 'new' | null>(null)
  const [transfer, setTransfer] = useState<AccountTransfer | 'new' | null>(null)
  const [account, setAccount] = useState<number | null>(null)

  return (
    <Page
      title="Money"
      actions={
        <>
          <Button variant="tinted" size="sm" icon={<ArrowRightLeft className="size-3.5" strokeWidth={2.6} />} onClick={() => setTransfer('new')}>
            Transfer
          </Button>
          <Button size="sm" icon={<PlusCircle className="size-3.5" strokeWidth={2.6} />} onClick={() => setEntry('new')}>
            Adjust
          </Button>
        </>
      }
      toolbar={
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'accounts', label: 'Accounts' },
            { value: 'adjustments', label: 'Adjustments' },
            { value: 'transfers', label: 'Transfers' },
          ]}
          className="md:w-96"
        />
      }
    >
      {tab === 'accounts' && <Accounts onOpen={setAccount} />}
      {tab === 'adjustments' && <EntryList onOpen={setEntry} />}
      {tab === 'transfers' && <TransferList onOpen={setTransfer} />}

      <Editor item={entry} render={(e, open) => <EntryForm entry={e} open={open} onDone={() => setEntry(null)} />} />
      <Editor item={transfer} render={(t, open) => <TransferForm tr={t} open={open} onDone={() => setTransfer(null)} />} />
      <Statement account={account} onClose={() => setAccount(null)} />
    </Page>
  )
}

function Accounts({ onOpen }: { onOpen: (id: number) => void }) {
  const names = useNames()
  const { data, isLoading } = useReport<Balances>('balances')
  if (isLoading || !data) return <Loading />
  const rows = data.accounts
    .map((a) => ({ ...a, account: names.masters.accounts.find((m) => m.id === a.account_id) }))
    .filter((a) => a.account && (!a.account.archived || Math.abs(a.balance) > 0.004))

  const exportCsv = () =>
    downloadCsv('balances.csv', ['Account', 'Money in', 'Money out', 'Adjustments', 'Balance'], rows.map((a) => [a.account!.name, a.money_in, a.money_out, a.adjustments, a.balance]))

  return (
    <>
      <div className="mb-3 rounded-[1.25rem] bg-accent p-5 text-on-accent">
        <div className="text-[0.875rem] font-medium opacity-80">Total money on hand</div>
        <div className="num display mt-1 text-[2.25rem] font-bold">{money(data.total)}</div>
      </div>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[0.8125rem] text-label-2">Tap an account to see every entry.</p>
        <ExportButton onClick={exportCsv} />
      </div>

      {/* Phones: simple rows. Wider screens: the full table. */}
      <Group className="md:hidden">
        {rows.map((a) => (
          <Row key={a.account_id} onClick={() => onOpen(a.account_id)} title={a.account!.name} subtitle={`In ${money(a.money_in)} · Out ${money(a.money_out)}`} trailing={money(a.balance)} tone={a.balance < 0 ? 'red' : undefined} />
        ))}
      </Group>
      <div className="mb-7 hidden overflow-hidden rounded-2xl bg-surface shadow-card md:block">
        <table className="num w-full text-[0.9375rem]">
          <thead>
            <tr className="text-[0.75rem] text-label-2">
              <th className="px-4 py-3 text-left font-medium">Account</th>
              <th className="px-4 py-3 text-right font-medium">Money in</th>
              <th className="px-4 py-3 text-right font-medium">Money out</th>
              <th className="px-4 py-3 text-right font-medium">Adjustments</th>
              <th className="px-4 py-3 text-right font-semibold text-label">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.account_id} onClick={() => onOpen(a.account_id)} className="row-press cursor-pointer border-t border-separator hover:bg-fill/50">
                <td className="px-4 py-3">{a.account!.name}</td>
                <td className="px-4 py-3 text-right text-green">{money(a.money_in)}</td>
                <td className="px-4 py-3 text-right">{money(a.money_out)}</td>
                <td className="px-4 py-3 text-right text-label-2">{money(a.adjustments)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${a.balance < 0 ? 'text-red' : ''}`}>{money(a.balance)}</td>
              </tr>
            ))}
            <tr className="border-t border-separator bg-surface-2 font-semibold">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right">{money(rows.reduce((s, a) => s + a.money_in, 0))}</td>
              <td className="px-4 py-3 text-right">{money(rows.reduce((s, a) => s + a.money_out, 0))}</td>
              <td className="px-4 py-3 text-right">{money(rows.reduce((s, a) => s + a.adjustments, 0))}</td>
              <td className="px-4 py-3 text-right">{money(data.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function Statement({ account, onClose }: { account: number | null; onClose: () => void }) {
  const names = useNames()
  const [last, setLast] = useState(account)
  if (account !== null && account !== last) setLast(account)
  const id = account ?? last
  const { data, isLoading } = useReport<StatementLine[]>('statement', { account_id: id }, id !== null)
  const exportCsv = () => data && downloadCsv(`${names.name('accounts', id)}-statement.csv`, ['Date', 'Details', 'Amount', 'Balance'], [...data].reverse().map((l) => [l.date, l.label, l.amount, l.balance]))
  return (
    <Sheet open={account !== null} onClose={onClose} title={names.name('accounts', id)} wide>
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty icon={<Wallet className="size-7" />} title="No entries yet" body="Payments, expenses, payouts, adjustments and transfers for this account appear here." />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between px-1 pt-1">
            <div>
              <div className="text-[0.8125rem] text-label-2">Balance now</div>
              <div className="num text-[1.5rem] font-semibold">{money(data[0].balance)}</div>
            </div>
            <ExportButton onClick={exportCsv} />
          </div>
          <Group>
            {data.map((l, i) => (
              <Row
                key={`${l.type}-${l.id}-${i}`}
                title={l.label}
                subtitle={date(l.date)}
                trailing={<span className={l.amount < 0 ? '' : 'text-green'}>{l.amount > 0 ? '+' : ''}{money(l.amount)}</span>}
                trailingSub={`Balance ${money(l.balance)}`}
              />
            ))}
          </Group>
        </>
      )}
    </Sheet>
  )
}

function EntryList({ onOpen }: { onOpen: (e: AccountEntry) => void }) {
  const names = useNames()
  const { data, isLoading } = useList<AccountEntry>('account_entries')
  if (isLoading) return <Loading />
  if (!data?.length)
    return <Empty icon={<PlusCircle className="size-7" />} title="No adjustments yet" body="Start by entering each account’s opening balance with Adjust." />
  return (
    <Group>
      {data.map((e) => (
        <Row
          key={e.id}
          onClick={() => onOpen(e)}
          title={names.name('accounts', e.account_id)}
          subtitle={`${date(e.date)} · ${kindLabel(e.kind)}${e.note ? ` · ${e.note}` : ''}`}
          trailing={<span className={e.direction === 'in' ? 'text-green' : ''}>{e.direction === 'in' ? '+' : '−'}{money(e.amount)}</span>}
        />
      ))}
    </Group>
  )
}

function TransferList({ onOpen }: { onOpen: (t: AccountTransfer) => void }) {
  const names = useNames()
  const { data, isLoading } = useList<AccountTransfer>('account_transfers')
  if (isLoading) return <Loading />
  if (!data?.length) return <Empty icon={<ArrowRightLeft className="size-7" />} title="No transfers yet" body="Record money moved between accounts, e.g. Cash deposited into the bank." />
  return (
    <Group>
      {data.map((t) => (
        <Row key={t.id} onClick={() => onOpen(t)} title={`${names.name('accounts', t.from_account_id)} → ${names.name('accounts', t.to_account_id)}`} subtitle={`${date(t.date)}${t.note ? ` · ${t.note}` : ''}`} trailing={money(t.amount)} />
      ))}
    </Group>
  )
}

function EntryForm({ entry, open, onDone }: { entry: AccountEntry | null; open: boolean; onDone: () => void }) {
  const f = useRecordForm(toValues(entry, { date: todayISO(), account_id: '', direction: 'in', kind: 'opening', amount: '', note: '' }), {
    table: 'account_entries',
    saved: entry ? 'Adjustment updated' : 'Balance adjusted',
    onDone,
  })
  const v = f.values
  return (
    <Sheet open={open} onClose={onDone} title={entry ? 'Edit adjustment' : 'Adjust balance'} onSubmit={() => f.save()} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <Segmented value={v.direction} onChange={(x) => f.set('direction', x)} options={[{ value: 'in', label: 'Money in' }, { value: 'out', label: 'Money out' }]} />
        <FormGrid>
          <MasterSelect table="accounts" label="Account" value={v.account_id} onChange={(x) => f.set('account_id', x)} required />
          <Field label="Amount" required>
            <NumberInput prefix="₹" value={v.amount} onChange={(x) => f.set('amount', x)} placeholder="0.00" />
          </Field>
          <Field label="Type" required>
            <Select
              value={v.kind}
              onChange={(x) => {
                f.set('kind', x)
                const dir = KINDS.find((k) => k.value === x)?.direction
                if (dir) f.set('direction', dir)
              }}
            >
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </Select>
          </Field>
          <Field label="Date" required>
            <DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} />
          </Field>
        </FormGrid>
        <Field label="Note">
          <TextArea value={v.note} onChange={(e) => f.set('note', e.target.value)} placeholder="Optional" />
        </Field>
        <p className="px-1 text-[0.8125rem] text-label-2">Capital and withdrawals change the balance but don’t count as income or expense, so profit stays accurate.</p>
        {f.isEdit && <DeleteButton label="Delete adjustment" onClick={() => f.remove('adjustment')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}

function TransferForm({ tr, open, onDone }: { tr: AccountTransfer | null; open: boolean; onDone: () => void }) {
  const f = useRecordForm(toValues(tr, { date: todayISO(), from_account_id: '', to_account_id: '', amount: '', note: '' }), {
    table: 'account_transfers',
    saved: tr ? 'Transfer updated' : 'Transfer saved',
    onDone,
  })
  const v = f.values
  const same = v.from_account_id && v.from_account_id === v.to_account_id
  return (
    <Sheet open={open} onClose={onDone} title={tr ? 'Edit transfer' : 'Transfer money'} onSubmit={() => (same ? f.setError('Choose two different accounts.') : f.save())} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <FormGrid>
          <MasterSelect table="accounts" label="From account" value={v.from_account_id} onChange={(x) => f.set('from_account_id', x)} required />
          <MasterSelect table="accounts" label="To account" value={v.to_account_id} onChange={(x) => f.set('to_account_id', x)} required />
          <Field label="Amount" required>
            <NumberInput prefix="₹" value={v.amount} onChange={(x) => f.set('amount', x)} placeholder="0.00" />
          </Field>
          <Field label="Date" required>
            <DateInput value={v.date} onChange={(e) => f.set('date', e.target.value)} />
          </Field>
        </FormGrid>
        <Field label="Note">
          <TextArea value={v.note} onChange={(e) => f.set('note', e.target.value)} placeholder="Optional" />
        </Field>
        {f.isEdit && <DeleteButton label="Delete transfer" onClick={() => f.remove('transfer')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}
