import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/api'
import { todayISO } from '@/lib/format'
import { useNavigate } from 'react-router'
import { AlertTriangle, ArrowRightLeft } from 'lucide-react'
import { Page } from '@/components/Layout'
import { DateRangePicker, useDateRange } from '@/components/common'
import { TrendChart } from '@/components/TrendChart'
import { Group, Loading, Row, Stat, StatGrid } from '@/components/ui'
import { useBoot, useNames, useReport } from '@/lib/data'
import { money, moneyShort, qty } from '@/lib/format'
import type { Dashboard } from '@/lib/types'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Overview() {
  const range = useDateRange()
  const { data: boot } = useBoot()
  const names = useNames()
  const navigate = useNavigate()
  const { data: d, isLoading } = useReport<Dashboard>('dashboard', range.range)

  const stock = useMemo(() => {
    if (!d) return []
    const byId = new Map(d.stock_by_design.map((s) => [s.design_id, s.qty]))
    return names.masters.designs
      .filter((x) => !x.archived || (byId.get(x.id) ?? 0) !== 0)
      .map((x) => ({ design: x, qty: byId.get(x.id) ?? 0, low: x.low_stock != null && (byId.get(x.id) ?? 0) <= x.low_stock }))
      .sort((a, b) => b.qty - a.qty)
  }, [d, names])
  const lowStock = stock.filter((s) => s.low)
  const firstName = boot?.user.name.split(' ')[0]
  // Until the old dashboard's data is brought over, owners get a way in from here.
  const isOwner = boot?.user.role === 'owner'
  const { data: legacy } = useQuery({ queryKey: ['legacy-status'], queryFn: () => get<{ last: unknown }>('legacy/status'), enabled: isOwner })
  const offerImport = isOwner && legacy && !legacy.last && d && d.sales_total === 0 && d.expenses === 0

  return (
    <Page title="Overview" subtitle={`${greeting()}${firstName ? `, ${firstName}` : ''}.`} toolbar={<DateRangePicker state={range} />}>
      {isLoading || !d ? (
        <Loading />
      ) : (
        <>
          {offerImport && (
            <button type="button" onClick={() => navigate('/settings', { state: { legacyImport: true } })} className="pressable mb-3 flex w-full items-center gap-3 rounded-[1.25rem] bg-surface p-4 text-left shadow-card md:p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><ArrowRightLeft className="size-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Bring your data over from the old dashboard</span>
                <span className="block text-[0.875rem] text-label-2">Sales, expenses, Amazon, GST, stock, balances and to-dos, in one go. You’ll see a preview first.</span>
              </span>
            </button>
          )}

          {/* Hero: the single number partners check most. */}
          <button type="button" onClick={() => navigate('/money')} className="pressable mb-3 block w-full rounded-[1.25rem] bg-accent p-5 text-left text-on-accent md:p-6">
            <div className="text-[0.875rem] font-medium opacity-80">Money on hand, all accounts</div>
            <div className="num display mt-1 text-[2.5rem] font-bold md:text-[3rem]">{money(d.money_on_hand)}</div>
            <div className="mt-1 text-[0.8125rem] opacity-75">As of now · tap for each account</div>
          </button>

          <StatGrid className="mt-3">
            <Stat label="Profit" value={moneyShort(d.profit)} tone={d.profit >= 0 ? 'green' : 'red'} sub="After fees and expenses" />
            <Stat label="Sales" value={moneyShort(d.sales_total)} sub="Direct sales, before GST" onClick={() => navigate('/sales')} />
            <Stat label="Money received" value={moneyShort(d.received)} sub="From direct sales" />
            <Stat label="Expenses" value={moneyShort(d.expenses)} onClick={() => navigate('/expenses')} />
            <Stat label="Owed to us" value={moneyShort(d.outstanding)} tone={d.outstanding > 0 ? 'red' : undefined} onClick={() => navigate('/receivables')} />
            <Stat label="Amazon revenue" value={moneyShort(d.amazon_revenue)} sub={`${qty(d.amazon_orders)} shipped orders, after refunds`} onClick={() => navigate('/amazon')} />
            <Stat label="Samples given" value={`${qty(d.samples)} pcs`} onClick={() => navigate('/samples')} />
            <Stat label="Stock on hand" value={`${qty(d.stock_total)} pcs`} sub="As of now" onClick={() => navigate('/stock')} />
          </StatGrid>

          {lowStock.length > 0 && (
            <Group title="Running low">
              {lowStock.map((s) => (
                <Row
                  key={s.design.id}
                  leading={<AlertTriangle className="size-5 text-orange" />}
                  title={s.design.name}
                  subtitle={`Warning set at ${qty(s.design.low_stock ?? 0)} pcs`}
                  trailing={`${qty(s.qty)} pcs`}
                  tone={s.qty < 0 ? 'red' : undefined}
                  onClick={() => navigate('/stock')}
                />
              ))}
            </Group>
          )}

          <WebsiteWeek onOpen={() => navigate('/analytics')} />

          <div className="grid gap-x-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Group title="Last 12 months">
                <div className="p-4">
                  <TrendChart data={d.trend} />
                </div>
              </Group>
              {d.top_customers.length > 0 && (
                <Group title="Top customers">
                  {d.top_customers.map((c, i) => (
                    <Row key={c.party} leading={<span className="num w-5 text-center text-[0.8125rem] font-semibold text-label-3">{i + 1}</span>} title={c.party} trailing={money(c.amount)} />
                  ))}
                </Group>
              )}
            </div>
            <div className="lg:col-span-2">
              <Group title="Stock by design" footer="Total across every location.">
                {stock.length === 0 ? (
                  <Row title="No stock recorded yet" tone="muted" />
                ) : (
                  stock.map((s) => (
                    <Row key={s.design.id} title={s.design.name} trailing={`${qty(s.qty)} pcs`} tone={s.qty < 0 ? 'red' : undefined} onClick={() => navigate('/stock')} chevron={false} />
                  ))
                )}
              </Group>
            </div>
          </div>
        </>
      )}
    </Page>
  )
}

/** The website's last seven days, in three numbers. */
function WebsiteWeek({ onOpen }: { onOpen: () => void }) {
  const to = todayISO()
  const d = new Date(`${to}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 6)
  const from = d.toISOString().slice(0, 10)
  const { data } = useQuery({
    queryKey: ['analytics', from, to],
    queryFn: () => get<{ totals: { visitors: number }; goals: Record<string, { count: number }>; first_day: string | null }>(`analytics/overview?from=${from}&to=${to}`),
    staleTime: 60_000,
  })
  if (!data?.first_day) return null
  const g = (k: string) => data.goals[k]?.count ?? 0
  return (
    <Group title="Website · last 7 days">
      <button type="button" onClick={onOpen} className="row-press grid w-full grid-cols-3 text-left">
        {[
          ['Visitors', data.totals.visitors],
          ['Enquiries', g('bulk_enquiry') + g('contact_message') + g('whatsapp')],
          ['Amazon taps', g('amazon')],
        ].map(([label, n]) => (
          <span key={label} className="border-r border-separator px-4 py-3 last:border-r-0">
            <span className="block text-[0.8125rem] text-label-2">{label}</span>
            <span className="num display block text-[1.25rem] font-semibold">{qty(Number(n))}</span>
          </span>
        ))}
      </button>
    </Group>
  )
}
