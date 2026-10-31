// Tests moving data over from the old Netlify dashboard. Run after
// acceptance.mjs against the SAME scratch database (it signs in as the owner
// that test created), with a backup file exported from the old dashboard:
//   node tests/legacy.mjs http://127.0.0.1:8082 old-backup.json
// It REPLACES the business data, so never point it at production.

import { readFileSync } from 'node:fs'

const base = (process.argv[2] ?? 'http://127.0.0.1:8082') + '/api/'
const file = process.argv[3]
if (!file) throw new Error('Pass the old dashboard backup file as the second argument.')
const old = JSON.parse(readFileSync(file, 'utf8'))
let cookie = ''
let failures = 0

async function api(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-TK-Client': '1', Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const set = res.headers.get('set-cookie')
  if (set) cookie = set.split(';')[0]
  return { status: res.status, json: await res.json() }
}
async function ok(method, path, body) {
  const r = await api(method, path, body)
  if (r.status >= 400) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(r.json)}`)
  return r.json
}
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`)
}
const round = (n) => Math.round(n * 100) / 100

await ok('POST', 'auth/login', { email: 'owner@test.local', password: 'test-password-1' })

// Files that aren't the old dashboard's are refused before anything changes.
const ours = await ok('GET', 'backup')
check('Our own backup is refused with a hint', (await api('POST', 'legacy/import', { data: ours, dry_run: true })).json.error?.includes('Restore'), true)
check('A random file is refused', (await api('POST', 'legacy/import', { data: { hello: 1 }, dry_run: true })).status, 422)

// A preview changes nothing.
const salesBefore = (await ok('GET', 'sales')).length
const preview = await ok('POST', 'legacy/import', { data: old, dry_run: true })
check('Preview is a dry run', preview.dry_run, true)
check('Preview leaves the data alone', (await ok('GET', 'sales')).length, salesBefore)

// The Supabase row shape ({ id, data }) works too, and gives the same result.
const res = await ok('POST', 'legacy/import', { data: { id: 1, data: old } })
check('Import is not a dry run', res.dry_run, false)
for (const f of res.figures) {
  // Total sales can differ where the old sheet left freight out of a total, and Amazon figures where
  // the old app still counted cancelled or refunded orders: each is listed in the notes.
  if (['sales_total', 'amazon_revenue', 'gst_output'].includes(f.key) && !f.match) {
    check(`${f.label} differs only where a note explains it`, typeof f.explain, 'string')
    continue
  }
  check(`Same as the old dashboard: ${f.label}`, [f.new, f.match], [f.old, true])
}
check('Every sale came over', res.counts.sales, old.sales.length)
check('Every expense came over', res.counts.expenses, old.expenses.filter((e) => Number(e.amount) > 0).length)
// An order only marked refunded comes over as shipped and refunded: two rows.
const refundedOnly = old.amazon.filter((a) => a.status === 'Refund' && Number(a.amount) > 0 && !old.amazon.some((b) => b.orderId === a.orderId && b.status === 'Shipment' && Number(b.amount) > 0))
check('Every Amazon order came over', res.counts.amazon_orders, old.amazon.length + refundedOnly.length)
check('Every to-do came over', res.counts.todos, (old.todos ?? []).length)
check('Audit trail came over', res.counts.history, (old.audit ?? []).length)
check('Nothing skipped', res.skipped, [])

// Stock is exactly the old numbers, design by design and place by place.
const boot = await ok('GET', 'bootstrap')
const id = (list, name) => boot.masters[list].find((m) => m.name === name)?.id
const grid = (await ok('GET', 'reports/stock')).cells
for (const [key, want] of Object.entries(old.stock ?? {})) {
  const [d, l] = key.split('|||')
  check(`Stock of ${d} at ${l}`, grid.find((c) => c.design_id === id('designs', d) && c.location_id === id('locations', l))?.qty ?? 0, want)
}

// Account by account, balances match the old app's.
const balances = (await ok('GET', 'reports/balances')).accounts
const oldBalance = (name) =>
  round(
    old.sales.filter((s) => s.acct === name).reduce((a, s) => a + Number(s.received || 0), 0) -
      old.expenses.filter((e) => e.acct === name).reduce((a, e) => a + Number(e.amount || 0), 0) +
      (old.adjustments ?? []).filter((j) => j.acct === name).reduce((a, j) => a + (j.type === 'in' ? 1 : -1) * Number(j.amount || 0), 0),
  )
for (const name of old.accounts) {
  check(`Balance of ${name}`, balances.find((b) => b.account_id === id('accounts', name))?.balance ?? 0, oldBalance(name))
}

// GST on a sale: the customer owes goods + freight + GST, and the GST register follows it.
// Prefer one where taking GST off leaves the payments within the total.
const gstSale = old.sales.find((s) => s.hasGst && Number(s.received || 0) <= Number(s.total || 0)) ?? old.sales.find((s) => s.hasGst)
if (gstSale) {
  const sale = (await ok('GET', 'sales')).find((s) => s.party === gstSale.party && s.date === gstSale.date)
  check('GST sale total includes GST', sale.total, round(gstSale.gross))
  check('GST sale balance', sale.balance, round(gstSale.gross - gstSale.received))
  const line = (await ok('GET', 'gst_sales')).find((g) => g.sale_id === sale.id)
  check('GST register line made from the sale', [line?.auto, line?.gst, line?.paid], [true, round(gstSale.gstAmt), gstSale.received >= gstSale.gross ? 'Paid' : 'Unpaid'])
  check('Auto GST line cannot be edited by hand', (await api('PUT', `gst_sales/${line.id}`, { ...line, gst: 1 })).status, 422)
  if (sale.received <= sale.subtotal) {
    await ok('PUT', `sales/${sale.id}`, { ...sale, gst_rate: 0, payments: sale.payments })
    check('Removing GST from the sale removes its line', (await ok('GET', 'gst_sales')).some((g) => g.sale_id === sale.id), false)
  }
}

// To-dos: ticking one dates it.
const todo = (await ok('GET', 'todos')).find((t) => !t.done)
if (todo) {
  const done = await ok('PUT', `todos/${todo.id}`, { ...todo, done: 1 })
  check('Ticked task gets a completion date', [done.done, typeof done.done_on], [true, 'string'])
}

const status = await ok('GET', 'legacy/status')
check('Import is remembered', status.last?.counts?.sales, old.sales.length)
const activity = await ok('GET', 'activity?limit=500')
check('Old audit trail shows its users', activity.some((a) => a.entity === 'legacy' && a.user), (old.audit ?? []).length > 0)

console.log(failures ? `\n${failures} FAILED` : '\nAll legacy import tests passed.')
process.exit(failures ? 1 : 0)
