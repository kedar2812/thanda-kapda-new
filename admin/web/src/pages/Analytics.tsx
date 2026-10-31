import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, BarChart3, Mail, MessageCircle, Phone, ShoppingCart, Star, Camera, ClipboardList, Send } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { DateInput, Empty, Group, Loading, Notice, Row, Segmented, cx } from '@/components/ui'
import { VisitorsChart, type Metric, type SeriesPoint } from '@/components/VisitorsChart'
import { get } from '@/lib/api'
import { SITE_URL, toDoc, type SiteContent } from '@/lib/content'
import { date, plural, qty, relative, todayISO } from '@/lib/format'

interface Totals { visitors: number; views: number; sessions: number; views_per_visit: number; bounce_rate: number; avg_duration: number; conversion_rate: number }
interface Count { label: string; count: number }
interface Goal { count: number; visitors: number; previous: number; labels: Count[] }
interface Overview {
  from: string
  to: string
  previous: { from: string; to: string; totals: Totals }
  totals: Totals
  series: SeriesPoint[]
  pages: { path: string; views: number; visitors: number; avg_engaged: number; avg_depth: number }[]
  entries: Count[]
  sources: Count[]
  campaigns: Count[]
  devices: Count[]
  browsers: Count[]
  os: Count[]
  countries: Count[]
  goals: Record<string, Goal>
  first_day: string | null
}
interface Live {
  visitors: number
  pages: Count[]
  recent: { at: string; path: string; source: string; device: string; country: string | null }[]
  events: { at: string; name: string; label: string; path: string }[]
}

type Preset = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'last-month' | '12m' | 'custom'

function shift(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function rangeFor(p: Preset, custom: { from: string; to: string }) {
  const t = todayISO()
  const [y, m] = t.split('-').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  switch (p) {
    case 'today': return { from: t, to: t }
    case 'yesterday': return { from: shift(t, -1), to: shift(t, -1) }
    case '7d': return { from: shift(t, -6), to: t }
    case '30d': return { from: shift(t, -29), to: t }
    case 'month': return { from: `${y}-${pad(m)}-01`, to: t }
    case 'last-month': {
      const ly = m === 1 ? y - 1 : y
      const lm = m === 1 ? 12 : m - 1
      return { from: `${ly}-${pad(lm)}-01`, to: `${ly}-${pad(lm)}-${pad(new Date(Date.UTC(ly, lm, 0)).getUTCDate())}` }
    }
    case '12m': return { from: shift(t, -364), to: t }
    default: return custom.from && custom.to ? custom : { from: shift(t, -29), to: t }
  }
}

export function duration(s: number) {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${Math.floor(m / 60)}h ${m % 60}m`
}

/** Friendly names for website paths, from the content (product names can change). */
function pageName(path: string, c: SiteContent) {
  const p = path.replace(/\/+$/, '') || '/'
  const fixed: Record<string, string> = { '/': 'Home', '/products': c.site.nav.products, '/story': c.site.nav.story, '/bulk': c.site.nav.bulk, '/contact': c.site.nav.contact }
  if (fixed[p]) return fixed[p]
  const prod = c.products.find((x) => p === `/products/${x.slug}`)
  return prod ? prod.name : p
}

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' })
  } catch {
    return null
  }
})()
// Names only: Windows can't draw flag emoji and shows bare letters instead.
const country = (cc: string) => (cc ? (regionNames?.of(cc) ?? cc) : 'Unknown')

const GOALS: { key: string; label: string; icon: typeof Phone; hint: string }[] = [
  { key: 'bulk_enquiry', label: 'Bulk enquiries', icon: ClipboardList, hint: 'Sent the bulk order form to WhatsApp' },
  { key: 'contact_message', label: 'Contact messages', icon: Send, hint: 'Sent the contact form to WhatsApp' },
  { key: 'whatsapp', label: 'WhatsApp taps', icon: MessageCircle, hint: 'Tapped a WhatsApp link' },
  { key: 'amazon', label: 'Amazon taps', icon: ShoppingCart, hint: 'Went to buy on Amazon' },
  { key: 'call', label: 'Calls', icon: Phone, hint: 'Tapped the phone number' },
  { key: 'email', label: 'Emails', icon: Mail, hint: 'Tapped the email address' },
  { key: 'instagram', label: 'Instagram', icon: Camera, hint: 'Opened Instagram' },
  { key: 'google_reviews', label: 'Google reviews', icon: Star, hint: 'Opened the Google reviews' },
]

/** Percentage change, shown with an arrow and words, never colour alone. */
function Change({ now, before, lowerIsBetter }: { now: number; before: number; lowerIsBetter?: boolean }) {
  if (!before && !now) return <span className="text-label-3">No change</span>
  if (!before) return <span className="text-label-2">New</span>
  const pct = Math.round(((now - before) / before) * 100)
  if (pct === 0) return <span className="text-label-2">Same as before</span>
  const up = pct > 0
  const good = lowerIsBetter ? !up : up
  const Arrow = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cx('inline-flex items-center gap-0.5 font-medium', good ? 'text-green' : 'text-red')}>
      <Arrow className="size-3.5" strokeWidth={2.6} />
      {Math.abs(pct)}% {up ? 'up' : 'down'}
    </span>
  )
}

function Kpi({ label, value, now, before, lowerIsBetter, hint }: { label: string; value: ReactNode; now: number; before: number; lowerIsBetter?: boolean; hint: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl bg-surface p-4 shadow-card" title={hint}>
      <span className="text-[0.8125rem] font-medium text-label-2">{label}</span>
      <span className="num display mt-1 truncate text-[1.5rem] font-semibold">{value}</span>
      <span className="mt-0.5 text-[0.75rem]">
        <Change now={now} before={before} lowerIsBetter={lowerIsBetter} />
      </span>
    </div>
  )
}

/** A ranked list with a bar behind each row (one hue: it shows magnitude only). */
function Bars({ rows, total, empty = 'Nothing yet' }: { rows: { key: string; label: ReactNode; value: number; sub?: ReactNode }[]; total: number; empty?: string }) {
  if (!rows.length) return <Row title={empty} tone="muted" />
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <>
      {rows.map((r) => (
        <div key={r.key} className="relative border-b border-separator px-4 py-2.5 last:border-b-0">
          <span aria-hidden className="absolute inset-y-1 left-1 rounded-lg bg-accent-soft" style={{ width: `calc(${(r.value / max) * 100}% - 0.5rem)` }} />
          <div className="relative flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.9375rem]">{r.label}</div>
              {r.sub && <div className="truncate text-[0.75rem] text-label-2">{r.sub}</div>}
            </div>
            <div className="num shrink-0 text-right text-[0.9375rem]">
              {qty(r.value)}
              {total > 0 && <span className="ml-1.5 text-[0.75rem] text-label-3">{Math.round((r.value / total) * 100)}%</span>}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return <Segmented value={value} onChange={onChange} options={options} className="w-full max-w-sm" />
}

export default function Analytics() {
  const [preset, setPreset] = useState<Preset>('30d')
  const [custom, setCustom] = useState({ from: shift(todayISO(), -29), to: todayISO() })
  const range = rangeFor(preset, custom)
  const [metric, setMetric] = useState<Metric>('visitors')
  const [source, setSource] = useState<'sources' | 'campaigns' | 'entries'>('sources')
  const [tech, setTech] = useState<'devices' | 'browsers' | 'os'>('devices')
  const [liveOpen, setLiveOpen] = useState(false)

  const { data: d, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', range.from, range.to],
    queryFn: () => get<Overview>(`analytics/overview?from=${range.from}&to=${range.to}`),
    refetchInterval: 60_000,
  })
  const live = useQuery({ queryKey: ['analytics', 'live'], queryFn: () => get<Live>('analytics/live'), refetchInterval: 15_000 })
  const cms = useQuery({ queryKey: ['cms'], queryFn: () => get<{ published: { data: unknown } | null }>('cms') })
  const content = useMemo(() => toDoc(cms.data?.published?.data ?? null), [cms.data])
  const asin = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of content.products) {
      const a = p.amazonUrl.match(/\/dp\/([A-Z0-9]{10})/i)?.[1]
      if (a) m.set(a.toUpperCase(), p.name)
    }
    return m
  }, [content])

  const liveBadge = (
    <button type="button" onClick={() => setLiveOpen(true)} className="pressable inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[0.8125rem] font-medium shadow-card">
      <span className="relative flex size-2">
        {(live.data?.visitors ?? 0) > 0 && <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60" />}
        <span className={cx('relative inline-flex size-2 rounded-full', (live.data?.visitors ?? 0) > 0 ? 'bg-green' : 'bg-label-3')} />
      </span>
      <span className="num">{qty(live.data?.visitors ?? 0)}</span> on the site now
    </button>
  )

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Date range" value={preset} onChange={(e) => setPreset(e.target.value as Preset)} className="h-9 appearance-none rounded-[0.625rem] bg-fill px-3 text-[0.875rem] font-medium text-label outline-none">
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="month">This month</option>
        <option value="last-month">Last month</option>
        <option value="12m">Last 12 months</option>
        <option value="custom">Choose dates…</option>
      </select>
      {preset === 'custom' && (
        <div className="flex items-center gap-1.5">
          <DateInput aria-label="From" value={custom.from} max={custom.to} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="h-9 w-[9.5rem] rounded-[0.625rem] bg-fill text-[0.875rem]" />
          <span className="text-label-2">–</span>
          <DateInput aria-label="To" value={custom.to} min={custom.from} max={todayISO()} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="h-9 w-[9.5rem] rounded-[0.625rem] bg-fill text-[0.875rem]" />
        </div>
      )}
      <span className="flex-1" />
      {liveBadge}
    </div>
  )

  const t = d?.totals
  const p = d?.previous.totals
  const goalTotal = d ? GOALS.reduce((a, g) => a + (d.goals[g.key]?.count ?? 0), 0) : 0

  return (
    <Page title="Visitors" subtitle={`Who visits ${SITE_URL.replace(/^https?:\/\//, '')} and what they do there.`} toolbar={toolbar}>
      {isError ? (
        <Notice tone="red">{error.message}</Notice>
      ) : isLoading || !d || !t || !p ? (
        <Loading />
      ) : !d.first_day ? (
        <Empty
          icon={<BarChart3 className="size-7" />}
          title="No visits recorded yet"
          body="Counting starts as soon as the website with visitor counting is live. Numbers appear here within seconds of someone opening the site."
        />
      ) : (
        <>
          <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Kpi label="Visitors" value={qty(t.visitors)} now={t.visitors} before={p.visitors} hint="People who opened the site. Counted once per day per device." />
            <Kpi label="Page views" value={qty(t.views)} now={t.views} before={p.views} hint="Pages opened, in total." />
            <Kpi label="Time on site" value={duration(t.avg_duration)} now={t.avg_duration} before={p.avg_duration} hint="Average length of a visit." />
            <Kpi label="Left straight away" value={`${t.bounce_rate}%`} now={t.bounce_rate} before={p.bounce_rate} lowerIsBetter hint="Visits that saw one page for under 10 seconds (bounce rate)." />
            <Kpi label="Got in touch or bought" value={`${t.conversion_rate}%`} now={t.conversion_rate} before={p.conversion_rate} hint="Share of visitors who sent an enquiry, tapped WhatsApp, call, email or Amazon." />
          </div>

          <Group title={`Over time · ${date(d.from)}${d.from !== d.to ? ` – ${date(d.to)}` : ''}`} footer={`Compared with ${date(d.previous.from)}${d.previous.from !== d.previous.to ? ` – ${date(d.previous.to)}` : ''}.`}>
            <div className="p-4">
              <VisitorsChart data={d.series} metric={metric} onMetric={setMetric} />
            </div>
          </Group>

          <Group title="What visitors did" footer={goalTotal ? 'Each tap is counted once; percentages are of all visitors.' : 'Taps on WhatsApp, Amazon, phone and email, and form sends, appear here.'}>
            <div className="grid grid-cols-2 gap-px bg-separator sm:grid-cols-4">
              {GOALS.map((g) => {
                const v = d.goals[g.key]
                return (
                  <div key={g.key} className="bg-surface p-4" title={g.hint}>
                    <div className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-label-2">
                      <g.icon className="size-4" /> {g.label}
                    </div>
                    <div className="num display mt-1 text-[1.375rem] font-semibold">{qty(v?.count ?? 0)}</div>
                    <div className="text-[0.75rem]">
                      <Change now={v?.count ?? 0} before={v?.previous ?? 0} />
                      {t.visitors > 0 && (v?.visitors ?? 0) > 0 && <span className="text-label-3"> · {((v!.visitors / t.visitors) * 100).toFixed(1)}% of visitors</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Group>

          {(d.goals.amazon?.labels.length || d.goals.bulk_enquiry?.labels.length) ? (
            <div className="grid gap-x-6 lg:grid-cols-2">
              {d.goals.amazon?.labels.length ? (
                <Group title="Amazon taps by wipe">
                  <Bars total={d.goals.amazon.count} rows={d.goals.amazon.labels.map((l) => ({ key: l.label, label: asin.get(l.label.toUpperCase()) ?? (l.label === 'store' ? 'Amazon store' : l.label), value: l.count }))} />
                </Group>
              ) : <div />}
              {d.goals.bulk_enquiry?.labels.length ? (
                <Group title="Bulk enquiries by request">
                  <Bars total={d.goals.bulk_enquiry.count} rows={d.goals.bulk_enquiry.labels.map((l) => ({ key: l.label, label: l.label, value: l.count }))} />
                </Group>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-x-6 lg:grid-cols-2">
            <Group title="Pages" footer="Average time and how far down the page people scrolled.">
              <Bars
                total={t.views}
                rows={d.pages.map((x) => ({
                  key: x.path,
                  label: pageName(x.path, content),
                  value: x.views,
                  sub: `${plural(x.visitors, 'visitor')} · ${duration(x.avg_engaged)} on page${x.avg_depth ? ` · read ${x.avg_depth}%` : ''}`,
                }))}
              />
            </Group>
            <Group title="Where they came from">
              <div className="border-b border-separator p-3">
                <Tabs value={source} onChange={setSource} options={[{ value: 'sources', label: 'Sources' }, { value: 'entries', label: 'First page' }, { value: 'campaigns', label: 'Campaigns' }]} />
              </div>
              {source === 'sources' && <Bars total={t.sessions} rows={d.sources.map((x) => ({ key: x.label, label: x.label, value: x.count }))} />}
              {source === 'entries' && <Bars total={t.sessions} rows={d.entries.map((x) => ({ key: x.label, label: pageName(x.label, content), value: x.count }))} />}
              {source === 'campaigns' && (
                <Bars
                  total={t.visitors}
                  empty="No campaign links used. Add ?utm_campaign=name to links you share to see them here."
                  rows={d.campaigns.filter((x) => x.label).map((x) => ({ key: x.label, label: x.label, value: x.count }))}
                />
              )}
            </Group>
            <Group title="Devices">
              <div className="border-b border-separator p-3">
                <Tabs value={tech} onChange={setTech} options={[{ value: 'devices', label: 'Type' }, { value: 'browsers', label: 'Browser' }, { value: 'os', label: 'System' }]} />
              </div>
              <Bars
                total={t.visitors}
                rows={d[tech].map((x) => ({ key: x.label, label: tech === 'devices' ? ({ mobile: 'Phone', tablet: 'Tablet', desktop: 'Computer' } as Record<string, string>)[x.label] ?? x.label : x.label, value: x.count }))}
              />
            </Group>
            <Group title="Countries" footer="From each visitor’s time zone. No location data is collected.">
              <Bars total={t.visitors} rows={d.countries.map((x) => ({ key: x.label || 'unknown', label: country(x.label), value: x.count }))} />
            </Group>
          </div>

          <p className="mb-8 px-1 text-[0.8125rem] leading-relaxed text-label-2">
            Visitor counting is private by design: no cookies, nothing stored on visitors’ devices, and no IP addresses kept. A visitor is recognised for one
            day only. To leave your own visits out, open{' '}
            <a className="text-accent underline" href={`${SITE_URL}/?tk-ignore=1`} target="_blank" rel="noreferrer">
              this link
            </a>{' '}
            once on each phone or computer you use.
          </p>
        </>
      )}

      <Sheet open={liveOpen} onClose={() => setLiveOpen(false)} title="Right now">
        <div className="pt-1">
          <p className="mb-4 px-1 text-[0.9375rem] text-label-2">
            <b className="num text-label">{qty(live.data?.visitors ?? 0)}</b> {live.data?.visitors === 1 ? 'person has' : 'people have'} been on the site in the last 5 minutes.
          </p>
          {!!live.data?.pages.length && (
            <Group title="Pages open now">
              {live.data.pages.map((x) => <Row key={x.label} title={pageName(x.label, content)} trailing={qty(x.count)} />)}
            </Group>
          )}
          <Group title="Latest taps">
            {!live.data?.events.length ? <Row title="None yet" tone="muted" /> : live.data.events.map((e, i) => (
              <Row key={i} title={GOALS.find((g) => g.key === e.name)?.label ?? e.name} subtitle={`${pageName(e.path, content)}${e.label ? ` · ${asin.get(e.label.toUpperCase()) ?? e.label}` : ''}`} trailingSub={relative(e.at)} />
            ))}
          </Group>
          <Group title="Latest page views">
            {!live.data?.recent.length ? <Row title="None yet" tone="muted" /> : live.data.recent.map((r, i) => (
              <Row key={i} title={pageName(r.path, content)} subtitle={`${r.source} · ${({ mobile: 'Phone', tablet: 'Tablet', desktop: 'Computer' } as Record<string, string>)[r.device] ?? r.device}${r.country ? ` · ${country(r.country)}` : ''}`} trailingSub={relative(r.at)} />
            ))}
          </Group>
        </div>
      </Sheet>
    </Page>
  )
}
