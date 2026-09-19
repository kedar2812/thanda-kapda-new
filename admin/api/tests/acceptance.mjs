// Runs the spec's acceptance tests against a running API on an EMPTY database.
//   node tests/acceptance.mjs http://127.0.0.1:8081
// It creates the first owner account, so never point it at production data.

const base = (process.argv[2] ?? 'http://127.0.0.1:8081') + '/api/';
let cookie = '';
let failures = 0;

async function api(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-TK-Client': '1', Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  const json = await res.json();
  return { status: res.status, json };
}
async function ok(method, path, body) {
  const r = await api(method, path, body);
  if (r.status >= 400) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(r.json)}`);
  return r.json;
}
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`);
}

const today = new Date().toISOString().slice(0, 10);

const status = await ok('GET', 'auth/status');
if (!status.needs_setup) throw new Error('Database is not empty — run against a fresh database.');
await ok('POST', 'auth/setup', { name: 'Test Owner', email: 'owner@test.local', password: 'test-password-1' });

const boot = await ok('GET', 'bootstrap');
const find = (list, name) => boot.masters[list].find((x) => x.name === name).id;
const mocha = find('designs', 'Mocha');
const fakhri = find('locations', 'Fakhri Hills');
const bizCentre = find('locations', 'Business Centre');
const cash = find('accounts', 'Cash');
const quadra = find('accounts', 'Quadracore Current account');
const cat = find('categories', 'Other');

const stockAt = async (d, l) => (await ok('GET', 'reports/stock')).cells.find((c) => c.design_id === d && c.location_id === l)?.qty ?? 0;
const balanceOf = async (a) => (await ok('GET', 'reports/balances')).accounts.find((x) => x.account_id === a).balance;
const inAgeing = async (id) => (await ok('GET', 'reports/ageing')).sales.some((s) => s.id === id);

// 1
await ok('POST', 'stock_adjustments', { date: today, design_id: mocha, location_id: fakhri, mode: 'add', quantity: 100, reason: 'opening stock' });
check('1. Add 100 Mocha at Fakhri Hills', await stockAt(mocha, fakhri), 100);

// 2
const cashBefore = await balanceOf(cash);
let sale = await ok('POST', 'sales', {
  date: today, party: 'Test Café', design_id: mocha, location_id: fakhri, quantity: 30, price: 50, freight: 100,
  payments: [{ date: today, amount: 1000, account_id: cash }],
});
check('2. Stock after sale', await stockAt(mocha, fakhri), 70);
check('2. Sale total', sale.total, 1600);
check('2. Balance due', sale.balance, 600);
check('2. Cash +1000', await balanceOf(cash), cashBefore + 1000);
check('2. In ageing', await inAgeing(sale.id), true);

// 3
sale = await ok('PUT', `sales/${sale.id}`, { ...sale, quantity: 20 });
check('3. Stock after edit', await stockAt(mocha, fakhri), 80);
check('3. Total after edit', sale.total, 1100);
check('3. Balance after edit', sale.balance, 100);
await ok('DELETE', `sales/${sale.id}`);
check('3. Stock after delete', await stockAt(mocha, fakhri), 100);
check('3. Cash back', await balanceOf(cash), cashBefore);
check('3. Gone from ageing', await inAgeing(sale.id), false);

// 4
const dashBefore = await ok('GET', 'reports/dashboard');
await ok('POST', 'samples', { date: today, design_id: mocha, location_id: fakhri, quantity: 5, given_to: 'Café Test' });
const dashAfter = await ok('GET', 'reports/dashboard');
check('4. Sample reduces stock', await stockAt(mocha, fakhri), 95);
check('4. Sales unchanged', dashAfter.sales_total, dashBefore.sales_total);
check('4. Money unchanged', dashAfter.money_on_hand, dashBefore.money_on_hand);

// 5
let order = await ok('POST', 'amazon_orders', { date: today, order_id: '408-TEST-1', status: 'Shipment', design_id: mocha, location_id: fakhri, quantity: 10, invoice_amount: 500 });
check('5. Shipment reduces stock', await stockAt(mocha, fakhri), 85);
order = await ok('PUT', `amazon_orders/${order.id}`, { ...order, status: 'Cancel' });
check('5. Cancel restores stock', await stockAt(mocha, fakhri), 95);
order = await ok('PUT', `amazon_orders/${order.id}`, { ...order, status: 'Shipment' });
check('5. Back to Shipment', await stockAt(mocha, fakhri), 85);
await ok('DELETE', `amazon_orders/${order.id}`);
check('5. Delete restores stock', await stockAt(mocha, fakhri), 95);
const dup = await api('POST', 'amazon_orders', { date: today, order_id: 'X-1', status: 'Cancel' });
const dup2 = await api('POST', 'amazon_orders', { date: today, order_id: 'X-1', status: 'Cancel' });
check('5. Duplicate order ID warns', [dup.status, dup2.json.code], [200, 'duplicate']);

// 6
await ok('POST', 'stock_transfers', { date: today, design_id: mocha, from_location_id: fakhri, to_location_id: bizCentre, quantity: 20 });
check('6. Transfer out', await stockAt(mocha, fakhri), 75);
check('6. Transfer in', await stockAt(mocha, bizCentre), 20);
const same = await api('POST', 'stock_transfers', { date: today, design_id: mocha, from_location_id: fakhri, to_location_id: fakhri, quantity: 1 });
check('6. Same location blocked', same.status, 422);

// 7
const d1 = await ok('GET', 'reports/dashboard');
const q1 = await balanceOf(quadra);
await ok('POST', 'expenses', { date: today, paid_to: 'Printer', amount: 500, category_id: cat, account_id: quadra });
const d2 = await ok('GET', 'reports/dashboard');
check('7. Quadracore −500', await balanceOf(quadra), q1 - 500);
check('7. Expenses +500', d2.expenses, d1.expenses + 500);
check('7. Profit −500', d2.profit, d1.profit - 500);

// 8
await ok('POST', 'sales', { date: today, party: 'Keeper', design_id: mocha, location_id: fakhri, quantity: 1, price: 10 });
const mochaRow = (await ok('GET', 'designs')).find((d) => d.id === mocha);
await ok('PUT', `designs/${mocha}`, { ...mochaRow, name: 'Mocha Brown' });
const renamed = (await ok('GET', 'designs')).find((d) => d.id === mocha);
check('8. Rename keeps id', renamed.name, 'Mocha Brown');
check('8. Sales still linked', (await ok('GET', 'sales')).every((s) => s.design_id === mocha), true);

// 9
const del = await ok('DELETE', `designs/${mocha}`);
check('9. Used design is archived', del, { archived: true });
check('9. Still in history', (await ok('GET', 'designs')).find((d) => d.id === mocha)?.archived, true);

// Overpay needs confirmation
const over = await api('POST', 'sales', { date: today, party: 'Over', quantity: 1, price: 10, payments: [{ amount: 20, account_id: cash }] });
check('Overpay asks for confirmation', over.json.code, 'overpay');

// 11
const snapshot = async () => JSON.stringify([await ok('GET', 'reports/stock'), await ok('GET', 'reports/balances'), (await ok('GET', 'reports/dashboard'))]);
const before = await snapshot();
const backup = await ok('GET', 'backup');
await ok('POST', 'restore', { app: 'thanda-kapda-dashboard', version: 1, tables: Object.fromEntries(Object.keys(backup.tables).map((t) => [t, t === 'settings' ? backup.tables[t] : []])) });
check('11. Wipe empties stock', (await ok('GET', 'reports/stock')).cells.length, 0);
await ok('POST', 'restore', backup);
check('11. Restore gives identical numbers', await snapshot(), before);

console.log(failures ? `\n${failures} FAILED` : '\nAll acceptance tests passed.');
process.exit(failures ? 1 : 0);
