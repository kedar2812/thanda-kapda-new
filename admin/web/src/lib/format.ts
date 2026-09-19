const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const inrWhole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const qtyFmt = new Intl.NumberFormat('en-IN')

/** ₹1,25,000.00 */
export function money(n: number | null | undefined): string {
  const v = n ?? 0
  return (v < 0 ? '−₹' : '₹') + inr.format(Math.abs(v))
}

/** ₹1,25,000 for big headline figures where paise add noise. */
export function moneyShort(n: number | null | undefined): string {
  const v = Math.round(n ?? 0)
  return (v < 0 ? '−₹' : '₹') + inrWhole.format(Math.abs(v))
}

export function qty(n: number | null | undefined): string {
  const v = n ?? 0
  return (v < 0 ? '−' : '') + qtyFmt.format(Math.abs(v))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 2026-09-19 → 19 Sep 2026 */
export function date(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`
}

/** 2026-09 → Sep 2026 */
export function month(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

export function monthShort(ym: string): string {
  return MONTHS[Number(ym.split('-')[1]) - 1]
}

export function dateTime(iso: string): string {
  const [d, t] = iso.split(' ')
  return `${date(d)}, ${t?.slice(0, 5) ?? ''}`
}

export function relative(iso: string): string {
  const then = new Date(iso.replace(' ', 'T') + '+05:30').getTime()
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return dateTime(iso)
}

export function todayISO(): string {
  const d = new Date(Date.now() + 330 * 60000) // India time, whatever the device says
  return d.toISOString().slice(0, 10)
}

export function plural(n: number, one: string, many = one + 's') {
  return `${qty(n)} ${n === 1 ? one : many}`
}
