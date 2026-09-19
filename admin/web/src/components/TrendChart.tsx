import { useState } from 'react'
import { money, moneyShort, month, monthShort } from '@/lib/format'
import { Segmented } from './ui'

interface Point { month: string; income: number; expenses: number }

const H = 180
const PAD = { top: 12, right: 4, bottom: 24, left: 52 }

function niceMax(v: number) {
  if (v <= 0) return 1000
  const p = 10 ** Math.floor(Math.log10(v))
  return Math.ceil(v / p) * p
}

/** Monthly income (sales + Amazon) vs expenses as grouped bars, with a table view. */
export function TrendChart({ data }: { data: Point[] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const max = niceMax(Math.max(...data.map((d) => Math.max(d.income, d.expenses))))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const slot = plotW / data.length
  const barW = Math.max(3, Math.min(14, slot / 2 - 3))
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const ticks = [0, max / 2, max]

  // Rounded top corners only (4px), anchored flat on the baseline.
  const bar = (x: number, v: number) => {
    const top = y(v)
    const h = PAD.top + plotH - top
    if (h <= 0.5) return ''
    const r = Math.min(4, h, barW / 2)
    return `M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + barW - r}Q${x + barW},${top} ${x + barW},${top + r}V${top + h}Z`
  }

  const h = hover !== null ? data[hover] : null

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-[0.8125rem] text-label-2" aria-hidden={view === 'table'}>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-series-1" />Money coming in</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-series-2" />Expenses</span>
        </div>
        <Segmented value={view} onChange={setView} options={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }]} className="w-40" />
      </div>

      {view === 'chart' ? (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Money coming in and expenses for the last 12 months" onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--separator)" strokeWidth={t === 0 ? 1 : 0.75} strokeDasharray={t === 0 ? undefined : '2 4'} />
                {(
                  <text x={PAD.left - 8} y={y(t) + 3} textAnchor="end" className="fill-label-3 text-[10px]">{moneyShort(t)}</text>
                )}
              </g>
            ))}
            {data.map((d, i) => {
              const cx = PAD.left + slot * i + slot / 2
              const active = hover === i
              return (
                <g key={d.month}>
                  {active && <rect x={PAD.left + slot * i + 1} y={PAD.top} width={slot - 2} height={plotH} rx={6} fill="var(--fill)" />}
                  <path d={bar(cx - barW - 1, d.income)} fill="var(--series-1)" opacity={hover === null || active ? 1 : 0.45} />
                  <path d={bar(cx + 1, d.expenses)} fill="var(--series-2)" opacity={hover === null || active ? 1 : 0.45} />
                  <text x={cx} y={H - 6} textAnchor="middle" className={active ? 'fill-label text-[10px] font-semibold' : 'fill-label-3 text-[10px]'}>{monthShort(d.month)}</text>
                  {/* Hit target: the whole month column, bigger than the bars. */}
                  <rect
                    x={PAD.left + slot * i}
                    y={0}
                    width={slot}
                    height={H}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onClick={() => setHover(hover === i ? null : i)}
                    tabIndex={0}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    aria-label={`${month(d.month)}: coming in ${money(d.income)}, expenses ${money(d.expenses)}`}
                    style={{ outline: 'none', cursor: 'default' }}
                  />
                </g>
              )
            })}
          </svg>
          {h && hover !== null && (
            <div
              className="chrome pointer-events-none absolute top-0 z-10 min-w-44 rounded-xl px-3 py-2 text-[0.8125rem] shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-separator"
              style={{ left: `clamp(0px, calc(${((PAD.left + slot * hover + slot / 2) / W) * 100}% - 5.5rem), calc(100% - 11rem))` }}
            >
              <div className="mb-1 font-semibold">{month(h.month)}</div>
              <div className="flex justify-between gap-4"><span className="flex items-center gap-1.5 text-label-2"><span className="size-2 rounded-[2px] bg-series-1" />Coming in</span><span className="num">{money(h.income)}</span></div>
              <div className="flex justify-between gap-4"><span className="flex items-center gap-1.5 text-label-2"><span className="size-2 rounded-[2px] bg-series-2" />Expenses</span><span className="num">{money(h.expenses)}</span></div>
              <div className="mt-1 flex justify-between gap-4 border-t border-separator pt-1"><span className="text-label-2">Difference</span><span className="num font-semibold">{money(h.income - h.expenses)}</span></div>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="num w-full text-[0.875rem]">
            <thead>
              <tr className="text-left text-[0.75rem] text-label-2">
                <th className="py-1.5 font-medium">Month</th>
                <th className="py-1.5 text-right font-medium">Coming in</th>
                <th className="py-1.5 text-right font-medium">Expenses</th>
                <th className="py-1.5 text-right font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.month} className="border-t border-separator">
                  <td className="py-2">{month(d.month)}</td>
                  <td className="py-2 text-right">{money(d.income)}</td>
                  <td className="py-2 text-right">{money(d.expenses)}</td>
                  <td className="py-2 text-right font-medium">{money(d.income - d.expenses)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
