export type MasterTable = 'designs' | 'locations' | 'accounts' | 'categories' | 'people'

export interface Meta {
  id: number
  created_at: string
  created_by: number | null
  updated_at: string
  updated_by: number | null
}

export interface Master extends Meta {
  name: string
  sort: number
  archived: boolean
  low_stock?: number | null
}

export interface User {
  id: number
  name: string
  email: string
  role: 'owner' | 'staff'
  theme: 'light' | 'dark' | 'system'
}

export interface Boot {
  user: User
  masters: Record<MasterTable, Master[]>
  version: number
  today: string
  user_names: Record<string, string>
}

export interface Payment {
  id?: number
  date: string
  amount: number
  account_id: number
}

export interface Sale extends Meta {
  date: string
  party: string
  design_id: number | null
  location_id: number | null
  quantity: number
  price: number
  freight: number
  person_id: number | null
  notes: string | null
  payments: Payment[]
  total: number
  received: number
  balance: number
  status: 'paid' | 'partial' | 'unpaid'
  days?: number
}

export interface Sample extends Meta {
  date: string
  design_id: number
  location_id: number
  quantity: number
  given_to: string
  person_id: number | null
  remark: string | null
}

export interface Expense extends Meta {
  date: string
  paid_to: string
  amount: number
  category_id: number
  account_id: number
  person_id: number | null
  remarks: string | null
}

export interface AmazonOrder extends Meta {
  date: string
  order_id: string
  customer: string | null
  city: string | null
  status: 'Shipment' | 'Cancel' | 'Refund'
  invoice_no: string | null
  design_id: number | null
  location_id: number | null
  quantity: number
  taxable: number
  tax: number
  invoice_amount: number
}

export interface AmazonSettlement extends Meta {
  date: string
  account_id: number
  amount: number
  fees: number
  reference: string | null
  note: string | null
}

export interface GstEntry extends Meta {
  date: string
  supplier?: string
  party?: string
  gstin: string | null
  invoice_no: string | null
  taxable: number
  gst: number
  total: number
  sale_id?: number | null
}

export interface AccountEntry extends Meta {
  date: string
  account_id: number
  direction: 'in' | 'out'
  kind: 'opening' | 'capital' | 'withdrawal' | 'correction' | 'other'
  amount: number
  note: string | null
}

export interface AccountTransfer extends Meta {
  date: string
  from_account_id: number
  to_account_id: number
  amount: number
  note: string | null
}

export interface StockAdjustment extends Meta {
  date: string
  design_id: number
  location_id: number
  mode: 'add' | 'remove' | 'set'
  quantity: number
  reason: string
  note: string | null
}

export interface StockTransfer extends Meta {
  date: string
  design_id: number
  from_location_id: number
  to_location_id: number
  quantity: number
  note: string | null
}

export interface StockGrid {
  cells: { design_id: number; location_id: number; qty: number }[]
}

export interface StockMove {
  type: string
  id: number
  date: string
  label: string
  change: number
  balance: number
}

export interface Balances {
  accounts: { account_id: number; money_in: number; money_out: number; adjustments: number; balance: number }[]
  total: number
}

export interface StatementLine {
  type: string
  id: number
  date: string
  label: string
  amount: number
  balance: number
}

export interface Ageing {
  total: number
  count: number
  oldest_days: number
  buckets: { label: string; count: number; amount: number }[]
  customers: { party: string; count: number; amount: number }[]
  sales: Sale[]
}

export interface Dashboard {
  money_on_hand: number
  sales_total: number
  expenses: number
  amazon_revenue: number
  amazon_orders: number
  amazon_fees: number
  profit: number
  received: number
  outstanding: number
  samples: number
  stock_total: number
  stock_by_design: { design_id: number; qty: number }[]
  expenses_by_category: { category_id: number; amount: number }[]
  top_customers: { party: string; amount: number }[]
  trend: { month: string; income: number; expenses: number }[]
}

export interface GstMonth {
  month: string
  output: number
  input: number
  output_taxable: number
  input_taxable: number
  net: number
}

export interface Activity {
  id: number
  at: string
  user: string | null
  action: string
  entity: string
  entity_id: number | null
  summary: string
}
