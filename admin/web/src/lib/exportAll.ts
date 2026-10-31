// "Everything as Excel": every list in the dashboard, a sheet each.

import { get } from './api'
import type { Names } from './data'
import { workbook, type SheetData } from './xlsx'
import type {
  AccountEntry, AccountTransfer, Activity, Ageing, AmazonOrder, AmazonSettlement, Balances, Dashboard, Expense, GstEntry, GstMonth, Sale, Sample, StockGrid, Todo,
} from './types'

export async function everythingWorkbook(names: Names): Promise<Blob> {
  const [dash, sales, ageing, expenses, orders, payouts, samples, gstP, gstS, gstMonths, balances, entries, transfers, stock, todos, activity] = await Promise.all([
    get<Dashboard>('reports/dashboard'),
    get<Sale[]>('sales'),
    get<Ageing>('reports/ageing'),
    get<Expense[]>('expenses'),
    get<AmazonOrder[]>('amazon_orders'),
    get<AmazonSettlement[]>('amazon_settlements'),
    get<Sample[]>('samples'),
    get<GstEntry[]>('gst_purchases'),
    get<GstEntry[]>('gst_sales'),
    get<GstMonth[]>('reports/gst'),
    get<Balances>('reports/balances'),
    get<AccountEntry[]>('account_entries'),
    get<AccountTransfer[]>('account_transfers'),
    get<StockGrid>('reports/stock'),
    get<Todo[]>('todos'),
    get<Activity[]>('activity?limit=500'),
  ])
  const n = names.name
  const person = (id: number | null) => (id ? n('people', id) : '')

  const designs = names.masters.designs.filter((d) => !d.archived || stock.cells.some((c) => c.design_id === d.id && c.qty !== 0))
  const locations = names.masters.locations.filter((l) => !l.archived || stock.cells.some((c) => c.location_id === l.id && c.qty !== 0))
  const qtyAt = (d: number, l: number) => stock.cells.find((c) => c.design_id === d && c.location_id === l)?.qty ?? 0

  const sheets: SheetData[] = [
    {
      name: 'Overview',
      header: ['Figure', 'Value'],
      rows: [
        ['Money on hand', dash.money_on_hand], ['Sales (before GST)', dash.sales_total], ['Money received', dash.received], ['Owed to us', dash.outstanding],
        ['Expenses', dash.expenses], ['Amazon revenue (after refunds)', dash.amazon_revenue], ['Amazon fees', dash.amazon_fees], ['Profit', dash.profit],
        ['Samples given (pieces)', dash.samples], ['Stock on hand (pieces)', dash.stock_total],
      ],
    },
    {
      name: 'Sales',
      header: ['Date', 'Invoice no.', 'Customer', 'Customer GSTIN', 'Design', 'Location', 'Quantity', 'Price per piece', 'Freight', 'Before GST', 'GST %', 'GST', 'Total', 'Received', 'Balance due', 'Status', 'Handled by', 'Notes'],
      rows: sales.map((s) => [s.date, s.invoice_no, s.party, s.gstin, n('designs', s.design_id), n('locations', s.location_id), s.quantity, s.price, s.freight, s.subtotal, s.gst_rate, s.gst, s.total, s.received, s.balance, s.status, person(s.person_id), s.notes]),
    },
    {
      name: 'Sale payments',
      header: ['Received on', 'Customer', 'Sale date', 'Amount', 'Into account'],
      rows: sales.flatMap((s) => s.payments.map((p) => [p.date, s.party, s.date, p.amount, n('accounts', p.account_id)])),
    },
    {
      name: 'Owed to us',
      header: ['Sale date', 'Customer', 'Total', 'Received', 'Balance due', 'Days', 'Handled by'],
      rows: ageing.sales.map((s) => [s.date, s.party, s.total, s.received, s.balance, s.days ?? null, person(s.person_id)]),
    },
    {
      name: 'Expenses',
      header: ['Date', 'Paid to', 'Amount', 'Category', 'Paid from', 'Paid by', 'Remarks'],
      rows: expenses.map((e) => [e.date, e.paid_to, e.amount, n('categories', e.category_id), n('accounts', e.account_id), person(e.person_id), e.remarks]),
    },
    {
      name: 'Amazon orders',
      header: ['Date', 'Order ID', 'Customer', 'City', 'Status', 'Invoice no.', 'Customer GSTIN', 'Design', 'Shipped from', 'Quantity', 'Taxable value', 'Tax', 'Invoice amount'],
      rows: orders.map((o) => [o.date, o.order_id, o.customer, o.city, o.status, o.invoice_no, o.gstin, n('designs', o.design_id), n('locations', o.location_id), o.quantity, o.taxable, o.tax, o.invoice_amount]),
    },
    {
      name: 'Amazon payouts',
      header: ['Date', 'Received into', 'Amount', 'Fees', 'Reference', 'Note'],
      rows: payouts.map((p) => [p.date, n('accounts', p.account_id), p.amount, p.fees, p.reference, p.note]),
    },
    {
      name: 'Samples',
      header: ['Date', 'Design', 'Location', 'Quantity', 'Given to', 'Given by', 'Remark'],
      rows: samples.map((s) => [s.date, n('designs', s.design_id), n('locations', s.location_id), s.quantity, s.given_to, person(s.person_id), s.remark]),
    },
    {
      name: 'GST purchases',
      header: ['Date', 'Supplier', 'GSTIN', 'Invoice no.', 'Taxable value', 'GST', 'Total', 'Bill status', 'Remarks'],
      rows: gstP.map((g) => [g.date, g.supplier, g.gstin, g.invoice_no, g.taxable, g.gst, g.total, g.paid, g.remarks]),
    },
    {
      name: 'GST sales',
      header: ['Date', 'Party', 'GSTIN', 'Invoice no.', 'Taxable value', 'GST', 'Total', 'Status', 'From', 'Remarks'],
      rows: gstS.map((g) => [g.date, g.party, g.gstin, g.invoice_no, g.taxable, g.gst, g.total, g.paid, g.auto ? (g.amazon_order_id ? 'Amazon order' : 'Sale') : 'Typed in', g.remarks]),
    },
    {
      name: 'GST by month',
      header: ['Month', 'Taxable sales', 'GST collected', 'Taxable purchases', 'GST paid', 'Net payable'],
      rows: gstMonths.map((m) => [m.month, m.output_taxable, m.output, m.input_taxable, m.input, m.net]),
    },
    {
      name: 'Accounts',
      header: ['Account', 'Money in', 'Money out', 'Adjustments', 'Balance'],
      rows: balances.accounts.filter((a) => Math.abs(a.balance) > 0.004 || !names.masters.accounts.find((m) => m.id === a.account_id)?.archived)
        .map((a) => [n('accounts', a.account_id), a.money_in, a.money_out, a.adjustments, a.balance]),
    },
    {
      name: 'Adjustments',
      header: ['Date', 'Account', 'In / out', 'Type', 'Amount', 'Note'],
      rows: entries.map((e) => [e.date, n('accounts', e.account_id), e.direction === 'in' ? 'In' : 'Out', e.kind, e.amount, e.note]),
    },
    {
      name: 'Transfers',
      header: ['Date', 'From', 'To', 'Amount', 'Note'],
      rows: transfers.map((t) => [t.date, n('accounts', t.from_account_id), n('accounts', t.to_account_id), t.amount, t.note]),
    },
    {
      name: 'Stock',
      header: ['Design', ...locations.map((l) => l.name), 'Total'],
      rows: designs.map((d) => {
        const row = locations.map((l) => qtyAt(d.id, l.id))
        return [d.name, ...row, row.reduce((a, b) => a + b, 0)]
      }),
    },
    {
      name: 'To-do',
      header: ['Task', 'Assigned to', 'Priority', 'Due', 'Status', 'Completed on', 'Notes'],
      rows: todos.map((t) => [t.title, t.assignee, t.priority, t.due, t.done ? 'Done' : 'To do', t.done_on, t.notes]),
    },
    {
      name: 'Activity',
      header: ['When', 'Who', 'Action', 'Details'],
      rows: activity.map((a) => [a.at, a.user, a.action, a.summary]),
    },
  ]
  return workbook(sheets)
}
