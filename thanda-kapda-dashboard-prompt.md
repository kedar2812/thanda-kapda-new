# Thanda Kapda — Internal Business Dashboard: Build Spec for Claude Code

## 0. How to use this spec

You are building an internal operations dashboard for **Thanda Kapda**, a wet-wipes manufacturing business run by a small group of partners. This file defines **what the system must do and the business rules it must follow**. It deliberately does **not** fix the tech stack or visual design.

Before writing code:
1. Read this whole file.
2. Propose a stack and architecture (frontend, backend/DB, auth, hosting) suited to: a few non-technical partners, shared live data, mobile-first use, low running cost. Keep it simple.
3. Raise anything in **Section 9 (Open Questions)** you need answered. Do not silently guess on those.
4. Then build in the phases in **Section 10**.

---

## 1. Business context

- Product: wet wipes, sold in multiple **designs** (print/packaging variants).
- Finished stock is stored across multiple **locations** (warehouses, partner homes, offices).
- Sales channels: direct B2B/B2C sales to parties, and **Amazon**.
- Free **samples** are given to cafés/restaurants as marketing.
- Money sits across several **accounts** (bank accounts, personal accounts of partners, cash).
- The business is GST-registered and needs purchase/sales GST records.
- Currency: Indian Rupees (₹), Indian digit grouping (1,00,000.00), amounts to 2 decimals.
- Users: 2–5 partners, **non-technical**. Every screen must be plain-language with clear labels. Primary device is a phone.

The dashboard's job: answer at any moment —
- **How much stock of each design is where?**
- **How much money do we have, and in which account?**
- **Who owes us money, and for how long?**
- **Are we profitable?**
- **What are our GST input/output figures?**

---

## 2. Core design principle — ledger, not counters

**Stock and account balances must never be stored as hand-maintained counters.** They must be **derived** from transaction records (sales, samples, Amazon orders, expenses, stock movements, balance adjustments).

Consequence: editing or deleting any record automatically produces correct stock and balances, with no "reverse the old effect, apply the new one" bookkeeping that can drift. If for performance you cache derived values, they must be recomputable from the ledger at any time and a mismatch treated as a bug.

Every record should store: `created_at`, `created_by`, `updated_at`, `updated_by`. Keep a simple **activity log** (who added/edited/deleted what, when) — multiple partners editing shared money data needs accountability.

---

## 3. Master data (editable by users in Settings)

Each list supports add / rename / archive. **Renaming must not break history** (records reference IDs, not names). **Removing an item that is used in records must archive it** (hidden from new-entry dropdowns, still shown in history), not hard-delete.

| List | Initial values |
|---|---|
| Designs | Morning Spring, Old Thanda Kapda design, Plain white, Namaste, Degchi's, Abiz's, Hakimee, Supreme, Mocha, Flavors and Colours |
| Locations | Fakhri Hills, A S Enterprise, Business Centre, Amour Affairs, Hamza's house |
| Money accounts | Quadracore Current account, Jameela A/c, Cash, Hamza A/c, Shabbir Piplodwala A/c |
| Expense categories | Packaging & Manufacturing, Transportation & Logistics, Marketing & Influencers, Legal & Professional Services, Website & IT, Telecom, Office Supplies & Stationery, Design & Creative, Samples & Materials, Testing & Quality, Refunds, Business Meetings & Entertainment, Other |
| People (partners/staff) | *(new list — used for "concerned person", "given by", "paid by" fields instead of free text; confirm names with the user)* |

Seed these as initial data only — no demo transactions.

---

## 4. Modules

### 4.1 Sales (direct)
**Fields:** date, party/customer, design, location (stock taken from), quantity, price per unit, freight, amount received, received date, account received into, concerned person, notes.

**Derived:**
- Total = quantity × price per unit + freight
- Balance due = total − total received
- Status: Paid (balance ≤ 0) / Partially paid / Unpaid

**Effects:**
- Stock: −quantity of that design at that location (only if design, location, quantity are all set).
- Money: +amount received into the chosen account.

**Rules:**
- Received date defaults to today when an amount received is entered.
- Validate: can't receive into no account; warn (don't block) if sale would take a location's stock negative.
- **Recommended improvement:** support multiple payments against one sale (a payments sub-list: date, amount, account). Real customers pay in instalments; a single "amount received" field loses history. Confirm with user (see Open Questions).

**List view:** searchable (party, design, person), filter All / Unpaid / Paid, date range filter. Paid rows show a "Paid" badge; others show balance due. Edit and delete on every row (delete asks for confirmation).

### 4.2 Samples
**Fields:** date, design, location, quantity, given to, given by, remark.
**Effects:** Stock −quantity at that location. **No revenue, no money effect.**
**Summary:** number of entries, total wipes sampled (optionally per design).
Searchable list, edit/delete.

### 4.3 Receivables Ageing (read-only report)
Built from unpaid/partially-paid sales. Age = today − sale date.
- Cards: total outstanding, number of unpaid invoices, oldest overdue (days).
- Age buckets: 0–30, 31–60, 61–90, 90+ days → count and amount.
- Outstanding by customer (sorted by amount).
- Unpaid sales list, oldest first, with days overdue.

### 4.4 Expenses
**Fields:** date, paid to, amount, category, account paid from, paid by (person), remarks.
**Effects:** Money −amount from the chosen account.
Searchable list with category and date-range filters, edit/delete. Category-wise totals.

### 4.5 Amazon Orders
**Fields:** date, order ID, customer, city, status (Shipment / Cancel / Refund), invoice no., design, location, quantity, taxable value, total tax, invoice amount.
**Effects:**
- Stock: only orders with status **Shipment** (and design + location + quantity set) deduct stock. Cancel/Refund do not. Because stock is derived (Section 2), changing status or deleting an order automatically restores stock.
- Money: **no direct account effect** by default (Amazon pays out in settlements, not per order) — see Open Questions.

**Summary:** total orders, shipped count, net revenue (sum of invoice amount for Shipment orders), total tax (Shipment orders).
Order ID should be unique — warn on duplicates. Searchable list, status filter, edit/delete.
**Nice to have:** CSV import of Amazon order reports (Amazon exports these; manual entry of many orders is painful).

### 4.6 GST Purchase (input GST register)
**Fields:** date, supplier, supplier GSTIN (optional), invoice no., taxable value, GST amount, total (= taxable + GST, auto-computed, editable).
**Effects:** none on stock or money — record only.
**Summary:** entries, total taxable, total GST paid (input credit). Month filter.

### 4.7 GST Sales (output GST register)
**Fields:** date, party, party GSTIN (optional), invoice no., taxable value, GST amount, total.
**Effects:** none on stock or money — parallel compliance record to the real sale.
**Summary:** entries, total taxable, total GST collected (output). Month filter.
**Nice to have:** a monthly GST summary: output GST − input GST = net payable.

### 4.8 Balance (money on hand)
Per account, derived:
- Money in = sale payments received into it + adjustments in
- Money out = expenses paid from it + adjustments out
- Balance = opening/adjustments + in − out

**Adjustment form:** account, direction (in / out), amount, date, note. Used for opening balances, capital introduced, withdrawals, corrections.
**Views:** per-account table (money in / money out / adjustments / balance), total money on hand, adjustment history with delete. Tapping an account shows its full statement (every transaction affecting it, running balance).
**Recommended:** an **account-to-account transfer** form (e.g. Cash → Quadracore) recorded as one transfer, not two unrelated adjustments.

### 4.9 Inventory
Stock is tracked per **design × location**.
- **Stock adjustment form:** design, location, set-to quantity OR add/remove quantity, date, reason (e.g. opening stock, new production received, damaged, count correction).
- **Internal transfer form:** design, from location, to location, quantity, date. Block if from = to.
- **Stock grid:** designs as rows, locations as columns, row and column totals, grand total. Negative values highlighted red.
- Tapping a cell shows its movement history (all sales, samples, Amazon shipments, adjustments, transfers for that design at that location).

### 4.10 Dashboard (home)
Summary cards, all respecting an optional date-range filter (default: all time; stock and money on hand are always "as of now"):
- Total money on hand (sum of all account balances)
- Total sales (direct sales totals)
- Total expenses
- Profit (definition — see Open Questions; default: direct sales + Amazon net revenue − expenses)
- Money received
- Outstanding (owed to us)
- Amazon revenue
- Samples given (wipes)
- Total stock on hand
- Stock on hand by design table (design → total units across all locations)

Nice to have: low-stock warning per design (threshold set in Settings), top customers, monthly sales vs expenses trend.

### 4.11 Settings
- Manage master lists (Section 3).
- Theme: light/dark toggle, remembered per user.
- Data: export full backup (JSON) and restore from backup (with a clear "this will replace current data" confirmation); export any list to CSV/Excel.

---

## 5. Multi-user and access

- Email + password login. Partners share **one business's data**.
- Changes by one partner appear for others without a manual refresh.
- A visible sync/connection status indicator; never lose an entry made while briefly offline (queue and sync, or at minimum warn clearly that it wasn't saved).
- Everything auto-saves on submit — no separate "save all" button.
- Concurrent edits: two partners editing different records must never overwrite each other. (Avoid storing the entire business as one blob that is overwritten on every save.)
- Roles are not required for v1, but design the data model so an "owner" vs "staff (entry-only)" split can be added later.

---

## 6. UX requirements

- Mobile-first; every form usable one-handed on a phone.
- Plain labels, no jargon ("Money received", not "AR settlement").
- Dropdowns for designs/locations/accounts/people/categories — never free text for these.
- Numeric inputs open a numeric keypad on mobile.
- Dates default to today; display as DD MMM YYYY.
- ₹ with Indian grouping everywhere; 2 decimals.
- Every list: search, sensible filters, newest first (except ageing: oldest first).
- Edit opens the same form pre-filled. Delete always confirms.
- Show the effect before saving where helpful (e.g. "Stock at Fakhri Hills after this sale: 120").

---

## 7. Validation rules (summary)

- Quantity, price, amounts: non-negative numbers.
- Amount received cannot exceed sale total without a confirmation ("Customer overpaid?").
- Transfer from/to locations must differ; transfer quantity > 0.
- Warn (not block) on anything that makes stock negative.
- Required fields per module are clearly marked; the form tells the user what's missing in plain words.

---

## 8. Out of scope for v1

- Customer-facing anything.
- Invoice PDF generation.
- Payroll.
- Automated Amazon API integration (CSV import is the maximum for v1).

---

## 9. Open questions — ask the user before building these parts

1. **Manufacturing/production:** Thanda Kapda manufactures its wipes. Should v1 track production — raw materials (fabric, liquid, packaging), production batches, finished goods added to a location, cost per pack? The original requirement only adds stock via manual adjustment. If production tracking is wanted, it changes the data model; if not, "new production received" is just a stock adjustment reason.
2. **Profit definition:** does profit include Amazon revenue? Should it be revenue excluding GST (taxable value)? Should stock purchase/manufacturing cost be treated as expense at purchase time (cash basis) — which is how the current spec behaves?
3. **Amazon money:** which account do Amazon settlements land in, and should settlements be recorded (e.g. as a receipt with fees deducted)?
4. **Sale payments:** one "amount received" per sale, or multiple instalments per sale?
5. **GST Sales vs Sales:** should a GST Sales entry be linkable to (or auto-created from) a direct sale, to avoid double entry?
6. **Personal accounts:** some accounts are partners' personal accounts. Should partner capital contributions/withdrawals be tracked separately from business income/expenses?
7. **People list:** names of partners/staff for "concerned person", "given by", "paid by".
8. **Existing data:** is there current data (spreadsheets) to import at launch?

---

## 10. Build phases

1. **Foundation:** stack setup, auth, shared data model (ledger-based), master data + Settings, layout/navigation, theme.
2. **Stock:** Inventory (adjustments, transfers, grid, movement history).
3. **Money:** Accounts, adjustments, transfers, Expenses, account statements.
4. **Sales:** Sales with stock + money effects, Ageing report.
5. **Samples + Amazon Orders.**
6. **GST registers** + monthly GST summary.
7. **Dashboard.**
8. **Backup/restore, CSV export, activity log, polish, mobile QA.**

After each phase: run it, test the flows below that apply, and report what was built and anything unresolved.

---

## 11. Acceptance tests (must all pass)

1. Add stock 100 of Mocha at Fakhri Hills → grid shows 100.
2. Sale of 30 Mocha from Fakhri Hills, ₹50/unit, freight ₹100, received ₹1,000 into Cash → stock 70; sale total ₹1,600; balance due ₹600; Cash +₹1,000; appears in Ageing.
3. Edit that sale to quantity 20 → stock 80; total ₹1,100; balance ₹100. Delete it → stock 100; Cash back to previous; removed from Ageing.
4. Sample of 5 Mocha from Fakhri Hills → stock −5; no change to sales or money.
5. Amazon order, Shipment, 10 Mocha from Fakhri Hills → stock −10. Edit to Cancel → stock restored. Edit back to Shipment, then delete → stock restored.
6. Transfer 20 Mocha Fakhri Hills → Business Centre → both cells update, total unchanged.
7. Expense ₹500 from Quadracore → Quadracore −₹500; dashboard expenses +₹500; profit −₹500.
8. Rename design "Mocha" → "Mocha Brown" → all history shows the new name; nothing breaks.
9. Try to remove a design used in sales → it is archived, not deleted; history intact.
10. Partner A adds a sale; Partner B sees it without refreshing.
11. Backup → wipe → restore → every number identical.
12. All amounts render as ₹ with Indian grouping (e.g. ₹1,25,000.00).
