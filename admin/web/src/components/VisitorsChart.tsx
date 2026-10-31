import { useState } from 'react'
import { qty } from '@/lib/format'
import { Segmented } from './ui'

export interface SeriesPoint { key: string; visitors: number; views: number }
export type Metric = 'visitors' | 'views'

const H = 200
const PAD = { top: 14, right: 4, bottom: 26, left: 40 }
const W = 720
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function niceMax(v: number) {
  if (v <= 4) return 4
  const p = 10 ** Math.floor(Math.log10(v))
  const steps = [1, 2, 2.5, 5, 10].map((s) => s * p)
  return steps.find((s) => s >= v) ?? Math.ceil(v / p) * p
}

/** "2026-10-26" → "26 Oct"; hours stay "14:00". */
function label(key: string, long = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key
  const [y, m, d] = key.split('-').map(Number)
  return long ? `${d} ${MONTHS[m - 1]} ${y}` : `${d} ${MONTHS[m - 1]}`
}

/**
 * Visitors or page views over time, one series at a time (they are counted
 * differently, so they never share an axis). Bars per day or per hour, with a
 * hover tooltip and a table view.
 */
export function VisitorsChart({ data, metric, onMetric }: { data: SeriesPoint[]; metric: Metric; onMetric: (m: Metric) => void }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [hover, setHover] = useState<number | null>(null)
  const values = data.map((d) => d[metric])
  const max = niceMax(Math.max(0, ...values))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const slot = plotW / Math.max(1, data.length)
  const gap = data.length > 40 ? 1 : 2
  const barW = Math.max(1.5, Math.min(22, slot - gap * 2))
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const ticks = [0, max / 2, max]
  const color = metric === 'visitors' ? 'var(--series-1)' : 'var(--series-2)'
  // Label every nth column so they never collide.
  const every = Math.ceil(data.length / (data.length > 24 ? 8 : 12))

  const bar = (x: number, v: number) => {
    const top = y(v)
    const h = PAD.top + plotH - top
    if (h <= 0.5) return ''
    const r = Math.min(4, h, barW / 2)
    return `M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + barW - r}Q${x + barW},${top} ${x + barW},${top + r}V${top + h}Z`
  }
  const h = hover !== null ? data[hover] : null
  const name = metric === 'visitors' ? 'Visitors' : 'Page views'

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented<Metric> value={metric} onChange={onMetric} options={[{ value: 'visitors', label: 'Visitors' }, { value: 'views', label: 'Page views' }]} className="w-56" />
        <Segmented value={view} onChange={setView} options={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }]} className="w-40" />
      </div>
      {view === 'chart' ? (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`${name} over the selected period`} onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--separator)" strokeWidth={t === 0 ? 1 : 0.75} strokeDasharray={t === 0 ? undefined : '2 4'} />
                <text x={PAD.left - 8} y={y(t) + 3} textAnchor="end" className="fill-label-3 text-[10px]">{qty(Math.round(t))}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = PAD.left + slot * i + (slot - barW) / 2
              const active = hover === i
              return (
                <g key={d.key}>
                  {active && <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={plotH} rx={4} fill="var(--fill)" />}
                  <path d={bar(x, d[metric])} fill={color} opacity={hover === null || active ? 1 : 0.45} />
                  {i % every === 0 && (
                    <text x={PAD.left + slot * i + slot / 2} y={H - 8} textAnchor="middle" className={active ? 'fill-label text-[10px] font-semibold' : 'fill-label-3 text-[10px]'}>
                      {label(d.key)}
                    </text>
                  )}
                  <rect
                    x={PAD.left + slot * i}
                    y={0}
                    width={slot}
                    height={H}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${label(d.key, true)}: ${qty(d[metric])} ${name.toLowerCase()}`}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    onClick={() => setHover(hover === i ? null : i)}
                    style={{ outline: 'none' }}
                  />
                </g>
              )
            })}
          </svg>
          {h && hover !== null && (
            <div
              className="chrome pointer-events-none absolute top-0 z-10 min-w-40 rounded-xl px-3 py-2 text-[0.8125rem] shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-separator"
              style={{ left: `clamp(0px, calc(${((PAD.left + slot * hover + slot / 2) / W) * 100}% - 5rem), calc(100% - 10rem))` }}
            >
              <div className="mb-1 font-semibold">{label(h.key, true)}</div>
              <div className="flex justify-between gap-4"><span className="flex items-center gap-1.5 text-label-2"><span className="size-2 rounded-[2px] bg-series-1" />Visitors</span><span className="num">{qty(h.visitors)}</span></div>
              <div className="flex justify-between gap-4"><span className="flex items-center gap-1.5 text-label-2"><span className="size-2 rounded-[2px] bg-series-2" />Page views</span><span className="num">{qty(h.views)}</span></div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-h-80 overflow-auto">
          <table className="num w-full text-[0.875rem]">
            <thead className="sticky top-0 bg-surface">
              <tr className="text-left text-[0.75rem] text-label-2">
                <th className="py-1.5 font-medium">{data[0]?.key.includes(':') ? 'Hour' : 'Day'}</th>
                <th className="py-1.5 text-right font-medium">Visitors</th>
                <th className="py-1.5 text-right font-medium">Page views</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.key} className="border-t border-separator">
                  <td className="py-2">{label(d.key, true)}</td>
                  <td className="py-2 text-right">{qty(d.visitors)}</td>
                  <td className="py-2 text-right">{qty(d.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
