import { useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Empty, Group, Loading, Row, Stat, StatGrid, cx } from '@/components/ui'
import { useNames, useReport } from '@/lib/data'
import { date, money, plural, qty } from '@/lib/format'
import type { Ageing, Sale } from '@/lib/types'
import { SaleSheet } from './Sales'

export default function Receivables() {
  const { data, isLoading } = useReport<Ageing>('ageing')
  const names = useNames()
  const [editing, setEditing] = useState<Sale | null>(null)

  return (
    <Page title="Money owed to us" subtitle="Unpaid and part-paid sales, oldest first.">
      {isLoading || !data ? (
        <Loading />
      ) : data.count === 0 ? (
        <Empty icon={<PartyPopper className="size-7" />} title="Nobody owes us anything" body="Every sale is fully paid." />
      ) : (
        <>
          <StatGrid className="lg:grid-cols-3">
            <Stat label="Total owed" value={money(data.total)} tone="red" />
            <Stat label="Unpaid sales" value={qty(data.count)} />
            <Stat label="Oldest" value={`${qty(data.oldest_days)} days`} className="col-span-2 lg:col-span-1" />
          </StatGrid>

          <Group title="How old">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {data.buckets.map((b, i) => (
                <div key={b.label} className={cx('border-separator p-4', i % 2 === 0 && 'border-r', i < 2 && 'border-b sm:border-b-0', i === 1 && 'sm:border-r', i === 2 && 'sm:border-r')}>
                  <div className="text-[0.8125rem] font-medium text-label-2">{b.label} days</div>
                  <div className={cx('num mt-1 text-[1.125rem] font-semibold', b.label === '90+' && b.amount > 0 && 'text-red')}>{money(b.amount)}</div>
                  <div className="text-[0.75rem] text-label-2">{plural(b.count, 'sale')}</div>
                </div>
              ))}
            </div>
          </Group>

          <div className="grid gap-x-6 lg:grid-cols-2">
            <Group title="By customer">
              {data.customers.map((c) => (
                <Row key={c.party} title={c.party} subtitle={plural(c.count, 'unpaid sale')} trailing={money(c.amount)} />
              ))}
            </Group>
            <Group title="Unpaid sales" footer="Tap a sale to record a payment.">
              {data.sales.map((s) => (
                <Row
                  key={s.id}
                  onClick={() => setEditing(s)}
                  title={s.party}
                  subtitle={`${date(s.date)} · ${names.name('designs', s.design_id)} · total ${money(s.total)}`}
                  trailing={money(s.balance)}
                  trailingSub={<span className={cx('font-medium', (s.days ?? 0) > 90 ? 'text-red' : (s.days ?? 0) > 30 ? 'text-orange' : '')}>{s.days === 0 ? 'Today' : `${qty(s.days ?? 0)} days`}</span>}
                />
              ))}
            </Group>
          </div>
        </>
      )}
      <SaleSheet sale={editing} onClose={() => setEditing(null)} />
    </Page>
  )
}
