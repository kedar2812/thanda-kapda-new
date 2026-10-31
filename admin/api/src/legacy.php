<?php
// Moving over from the old dashboard (thanda-kapda.netlify.app). That app kept
// the whole business as one JSON object; its Settings → "Export backup" button
// downloads it. Uploading that file here maps every record onto these tables,
// then works out the figures the old app showed (with its own formulas) and
// sets them beside ours, so the owner can see nothing was lost.
//
// A preview runs the whole import inside a transaction and rolls it back.

declare(strict_types=1);

/** Money the old app recorded without saying which account it went into or came out of. */
const LEGACY_UNSPECIFIED = 'Not specified (old dashboard)';

// Business data this replaces, children first. Logins, website content and visitor stats stay.
const LEGACY_WIPE = [
    'sale_payments', 'gst_sales', 'sales', 'samples', 'expenses', 'amazon_settlements', 'amazon_orders',
    'gst_purchases', 'account_entries', 'account_transfers', 'stock_adjustments', 'stock_transfers', 'todos',
    'designs', 'locations', 'accounts', 'categories', 'people',
];

// The old app's own starting lists, used when its file has none.
const LEGACY_DEFAULT_LISTS = [
    'designs' => ['Morning Spring', 'Old Thanda Kapda design', 'Plain white', 'Namaste', "Degchi's", "Abiz's", 'Hakimee', 'Supreme', 'Mocha', 'Flavors and Colours'],
    'locations' => ['Fakhri Hills', 'A S Enterprise', 'Business Centre', 'Amour Affairs', "Hamza's house"],
    'accounts' => ['Quadracore Current account', 'Jameela A/c', 'Cash', 'Hamza A/c', 'Shabbir Piplodwala A/c'],
    'categories' => ['Packaging & Manufacturing', 'Transportation & Logistics', 'Marketing & Influencers', 'Legal & Professional Services', 'Website & IT', 'Telecom', 'Office Supplies & Stationery', 'Design & Creative', 'Samples & Materials', 'Testing & Quality', 'Refunds', 'Business Meetings & Entertainment', 'Other'],
];

// ---------------------------------------------------------------- reading old values

function lg_list(array $old, string $key): array
{
    $v = $old[$key] ?? [];
    return is_array($v) ? array_values(array_filter($v, 'is_array')) : [];
}

function lg_str(mixed $v, int $max = 190): string
{
    return is_scalar($v) ? mb_substr(trim((string) $v), 0, $max) : '';
}

function lg_num(mixed $v): float
{
    if (is_int($v) || is_float($v)) {
        return (float) $v;
    }
    $s = str_replace([',', '₹', ' '], '', lg_str($v));
    return is_numeric($s) ? (float) $s : 0.0;
}

function lg_date(mixed $v): ?string
{
    $s = lg_str($v);
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $s, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
        return "$m[1]-$m[2]-$m[3]";
    }
    if (preg_match('#^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$#', $s, $m) && checkdate((int) $m[2], (int) $m[1], (int) $m[3])) {
        return sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
    }
    return null;
}

function lg_yes(mixed $v): bool
{
    return $v === true || $v === 1 || in_array(mb_strtolower(lg_str($v)), ['yes', 'true', '1'], true);
}

function lg_status(string $s): string
{
    $t = mb_strtolower($s);
    return str_contains($t, 'cancel') ? 'Cancel' : (str_contains($t, 'refund') || str_contains($t, 'return') ? 'Refund' : 'Shipment');
}

function lg_round(float $n): float
{
    return round($n, 2);
}

/**
 * A stand-in date for each row that has none: the old app kept rows in the
 * order they were typed (by date), so the nearest dated row before it, or after.
 */
function lg_nearby_dates(array $rows, string $fallback): array
{
    $out = [];
    $last = null;
    foreach ($rows as $i => $r) {
        $last = lg_date($r['date'] ?? null) ?? $last;
        $out[$i] = $last;
    }
    $next = null;
    for ($i = count($rows) - 1; $i >= 0; $i--) {
        $next = lg_date($rows[$i]['date'] ?? null) ?? $next;
        $out[$i] ??= $next ?? $fallback;
    }
    return $out;
}

/** The file may be the app's export, or the Supabase row ({ id, data: {...} }) around it. */
function legacy_payload(mixed $file): array
{
    if (is_array($file) && !isset($file['sales']) && is_array($file['data'] ?? null)) {
        $file = $file['data'];
    }
    if (is_array($file) && ($file['app'] ?? '') === 'thanda-kapda-dashboard') {
        throw new HttpError(422, 'This is a backup from this dashboard, not the old one. Use “Restore from a backup” instead.', 'validation');
    }
    $known = ['sales', 'expenses', 'amazon', 'gstPurchase', 'gstSales', 'samples', 'stock'];
    if (!is_array($file) || !array_filter($known, fn ($k) => isset($file[$k]) && is_array($file[$k]))) {
        throw new HttpError(422, 'This doesn’t look like a backup from the old dashboard. In the old dashboard open Settings and press “Export backup”, then choose that file.', 'validation');
    }
    return $file;
}

// ---------------------------------------------------------------- the old app's figures

/** The numbers the old dashboard showed on its tabs, using its formulas. */
function legacy_totals(array $old): array
{
    $sum = fn (array $rows, callable $f) => array_sum(array_map($f, $rows));
    $sales = lg_list($old, 'sales');
    $gst = fn ($s) => lg_yes($s['hasGst'] ?? false) ? (lg_num($s['gstAmt'] ?? 0) ?: lg_num($s['total'] ?? 0) * lg_num($s['gstRate'] ?? 0) / 100) : 0;
    $gross = fn ($s) => lg_num($s['total'] ?? 0) + $gst($s);

    $money = $sum($sales, fn ($s) => lg_str($s['acct'] ?? '') !== '' ? lg_num($s['received'] ?? 0) : 0)
        - $sum(lg_list($old, 'expenses'), fn ($e) => lg_str($e['acct'] ?? '') !== '' ? lg_num($e['amount'] ?? 0) : 0)
        + $sum(lg_list($old, 'adjustments'), fn ($j) => lg_str($j['acct'] ?? '') !== '' ? (($j['type'] ?? '') === 'in' ? 1 : -1) * lg_num($j['amount'] ?? 0) : 0);

    $stock = is_array($old['stock'] ?? null) ? $old['stock'] : [];
    $purchases = lg_list($old, 'gstPurchase');
    return [
        'money_on_hand' => $money,
        'sales_total' => $sum($sales, fn ($s) => lg_num($s['total'] ?? 0)),
        'sales_gst' => $sum($sales, $gst),
        'received' => $sum($sales, fn ($s) => lg_num($s['received'] ?? 0)),
        'outstanding' => $sum($sales, fn ($s) => max(0, $gross($s) - lg_num($s['received'] ?? 0))),
        'expenses' => $sum(lg_list($old, 'expenses'), fn ($e) => lg_num($e['amount'] ?? 0)),
        'amazon_revenue' => $sum(lg_list($old, 'amazon'), fn ($a) => lg_num($a['amount'] ?? 0)),
        'samples' => $sum(lg_list($old, 'samples'), fn ($s) => lg_num($s['qty'] ?? 0)),
        'stock_total' => array_sum(array_map('lg_num', $stock)),
        'gst_output' => $sum(lg_list($old, 'gstSales'), fn ($g) => lg_num($g['gst'] ?? 0)),
        'gst_input' => $sum($purchases, fn ($g) => lg_num($g['gst'] ?? 0)),
        'vendors_pending' => $sum($purchases, fn ($g) => ($g['paid'] ?? 'Pending') !== 'Paid' ? lg_num($g['total'] ?? 0) : 0),
    ];
}

/** The same figures from this dashboard's own reports. */
function current_totals(): array
{
    $sales = list_sales();
    $f = fn (string $sql) => (float) (scalar($sql) ?? 0);
    $stock = 0;
    foreach (stock_levels() as $locs) {
        $stock += array_sum($locs);
    }
    return [
        'money_on_hand' => balances()['total'],
        'sales_total' => array_sum(array_column($sales, 'subtotal')),
        'sales_gst' => array_sum(array_column($sales, 'gst')),
        'received' => $f('SELECT SUM(amount) FROM sale_payments'),
        'outstanding' => array_sum(array_map(fn ($s) => max(0, $s['balance']), $sales)),
        'expenses' => $f('SELECT SUM(amount) FROM expenses'),
        'amazon_revenue' => array_sum(array_column(amazon_income(), 'amount')),
        'samples' => $f('SELECT SUM(quantity) FROM samples'),
        'stock_total' => $stock,
        'gst_output' => $f('SELECT SUM(gst) FROM gst_sales'),
        'gst_input' => $f('SELECT SUM(gst) FROM gst_purchases'),
        'vendors_pending' => $f("SELECT SUM(total) FROM gst_purchases WHERE paid <> 'Paid'"),
    ];
}

const LEGACY_FIGURES = [
    'money_on_hand' => ['Money on hand', 'money'],
    'sales_total' => ['Total sales (before GST)', 'money'],
    'sales_gst' => ['GST on direct sales', 'money'],
    'received' => ['Money received from sales', 'money'],
    'outstanding' => ['Owed to us', 'money'],
    'expenses' => ['Total expenses', 'money'],
    'amazon_revenue' => ['Amazon revenue (after refunds)', 'money'],
    'samples' => ['Samples given (pieces)', 'qty'],
    'stock_total' => ['Stock on hand (pieces)', 'qty'],
    'gst_output' => ['GST collected (GST sales)', 'money'],
    'gst_input' => ['GST paid (GST purchases)', 'money'],
    'vendors_pending' => ['Pending to vendors', 'money'],
];

// ---------------------------------------------------------------- import

function import_legacy(array $in): array
{
    $old = legacy_payload($in['data'] ?? null);
    $dry = !empty($in['dry_run']);
    $ts = now();
    $notes = [];      // things changed to fit, so the owner can check them
    $skipped = [];    // records that could not be brought over at all
    $note = function (string $area, string $text) use (&$notes) { $notes[] = ['area' => $area, 'text' => $text]; };
    $tally = [];      // repeated notes, written once with a count
    $count = function (string $key) use (&$tally) { $tally[$key] = ($tally[$key] ?? 0) + 1; };

    // Every valid date in the file: the earliest dates the opening stock, the
    // latest stands in for the odd record that has none.
    $dates = [];
    foreach (['sales', 'expenses', 'amazon', 'samples', 'gstPurchase', 'gstSales', 'adjustments'] as $k) {
        foreach (lg_list($old, $k) as $r) {
            if ($d = lg_date($r['date'] ?? null)) {
                $dates[] = $d;
            }
        }
    }
    sort($dates);
    $fallbackDate = $dates ? end($dates) : today();
    $openingDate = $dates ? (new DateTimeImmutable($dates[0]))->modify('-1 day')->format('Y-m-d') : today();

    db()->beginTransaction();
    try {
        foreach (LEGACY_WIPE as $t) {
            db()->exec("DELETE FROM $t");
        }

        $insert = function (string $table, array $row) use ($ts): int {
            $row += ['created_at' => $ts, 'created_by' => uid(), 'updated_at' => $ts, 'updated_by' => uid()];
            $cols = array_keys($row);
            q("INSERT INTO $table (" . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')', array_values($row));
            return (int) db()->lastInsertId();
        };

        // ----- lists. Names the old lists no longer had, but records still use, come in archived.
        $ids = array_fill_keys(MASTER_TABLES, []);
        $master = function (string $table, string $name, bool $listed = false) use (&$ids, $insert): ?int {
            $name = mb_substr(trim($name), 0, 120);
            if ($name === '') {
                return null;
            }
            $key = mb_strtolower($name);
            return $ids[$table][$key] ??= $insert($table, ['name' => $name, 'sort' => count($ids[$table]), 'archived' => $listed ? 0 : 1]);
        };
        foreach (LEGACY_DEFAULT_LISTS as $table => $defaults) {
            $list = is_array($old[$table] ?? null) ? $old[$table] : $defaults;
            foreach ($list as $name) {
                $master($table, lg_str($name, 120), true);
            }
        }
        $unspecified = null;
        $account = function (string $name) use ($master, &$unspecified): int {
            return $name !== '' ? $master('accounts', $name) : ($unspecified ??= $master('accounts', LEGACY_UNSPECIFIED));
        };
        // The old app kept "person" as free text. Names become People; anything
        // else ("Received on 7th sep") is kept as a note on the record instead.
        $person = function (string $name) use ($master): ?int {
            if ($name === '' || preg_match('/\d/', $name) || count(preg_split('/\s+/', $name)) > 2) {
                return null;
            }
            return $master('people', $name, true);
        };
        $joinNotes = fn (array $parts) => ($t = implode("\n", array_filter($parts))) === '' ? null : $t;

        // ----- sales and the money received for them
        $saleIds = [];
        $recalculated = [];   // new total − old total, for sales whose old total didn't add up
        $nearby = lg_nearby_dates(lg_list($old, 'sales'), $fallbackDate);
        foreach (lg_list($old, 'sales') as $i => $r) {
            $party = lg_str($r['party'] ?? '') ?: '(no name)';
            $date = lg_date($r['date'] ?? null);
            if (!$date) {
                $date = $nearby[$i];
                $count('sale_date');
            }
            $label = "$party, " . $date;
            $qty = lg_num($r['qty'] ?? 0);
            $price = lg_num($r['price'] ?? 0);
            $freight = lg_num($r['freight'] ?? 0);
            $stored = array_key_exists('total', $r) ? lg_num($r['total']) : $qty * $price + $freight;
            if ($qty < 0 || $price < 0 || $freight < 0) {
                $skipped[] = "Sale to $label: negative quantity, price or freight.";
                continue;
            }
            if (fmod($qty, 1.0) !== 0.0) {
                $note('Sales', "$label: quantity " . $qty . ' rounded to ' . round($qty) . '.');
                $qty = round($qty);
            }
            // Some rows from the old Excel sheet had the price per piece in the freight column.
            if ($price == 0 && $qty > 1 && $freight > 0 && abs($qty * $freight - $stored) < 0.01) {
                $note('Sales', "$label: ₹$freight was in the freight column but is the price per piece (" . $qty . ' × ₹' . $freight . ' = ₹' . $stored . '). Moved it to price.');
                [$price, $freight] = [$freight, 0.0];
            } elseif ($qty == 0 && $price == 0 && $stored > $freight) {
                $note('Sales', "$label: had a total of ₹$stored but no quantity. Saved as 1 × ₹" . lg_round($stored - $freight) . '.');
                [$qty, $price] = [1.0, $stored - $freight];
            }
            if (abs($qty * $price + $freight - $stored) > 0.01) {
                $recalculated[] = $qty * $price + $freight - $stored;
                $note('Sales', "$label: the old total was ₹$stored; here it is quantity × price + freight = ₹" . lg_round($qty * $price + $freight) . '.');
            }
            $rate = lg_yes($r['hasGst'] ?? false) ? lg_num($r['gstRate'] ?? 0) : 0.0;

            $personName = lg_str($r['person'] ?? '', 120);
            $personId = $person($personName);
            $saleId = $insert('sales', [
                'date' => $date, 'party' => $party,
                'invoice_no' => lg_str($r['invoice'] ?? '', 60) ?: null, 'gstin' => mb_strtoupper(lg_str($r['gstin'] ?? '', 20)) ?: null,
                'design_id' => $master('designs', lg_str($r['design'] ?? '')), 'location_id' => $master('locations', lg_str($r['loc'] ?? '')),
                'quantity' => (int) $qty, 'price' => lg_round($price), 'freight' => lg_round($freight), 'gst_rate' => $rate,
                'person_id' => $personId,
                'notes' => $joinNotes([$personName !== '' && !$personId ? "Person (old dashboard): $personName" : '']),
            ]);
            $saleIds[] = $saleId;

            $received = lg_num($r['received'] ?? 0);
            if ($received < 0) {
                $note('Sales', "$label: money received was negative (₹$received) and was left out.");
            } elseif ($received > 0) {
                $acct = lg_str($r['acct'] ?? '', 120);
                if ($acct === '') {
                    $count('sale_no_account');
                }
                $insert('sale_payments', ['sale_id' => $saleId, 'date' => lg_date($r['recvDate'] ?? null) ?? $date, 'amount' => lg_round($received), 'account_id' => $account($acct)]);
            }
        }

        // ----- expenses
        $nearby = lg_nearby_dates(lg_list($old, 'expenses'), $fallbackDate);
        foreach (lg_list($old, 'expenses') as $i => $r) {
            $paidTo = lg_str($r['to'] ?? '') ?: '(not recorded)';
            $date = lg_date($r['date'] ?? null) ?? $nearby[$i];
            $amount = lg_num($r['amount'] ?? 0);
            $acct = lg_str($r['acct'] ?? '', 120);
            $by = lg_str($r['by'] ?? '', 120);
            if ($amount <= 0) {
                if ($amount < 0) {
                    // A negative expense put money back; keep that in the account as an adjustment.
                    $insert('account_entries', ['date' => $date, 'account_id' => $account($acct), 'direction' => 'in', 'kind' => 'correction', 'amount' => lg_round(-$amount),
                        'note' => "Negative expense in the old dashboard: $paidTo" . (lg_str($r['remarks'] ?? '') ? ' · ' . lg_str($r['remarks']) : '')]);
                    $note('Expenses', "$paidTo, $date: amount was −₹" . (-$amount) . '. Saved as money back into ' . ($acct ?: LEGACY_UNSPECIFIED) . ' (Money → Adjustments).');
                } else {
                    $skipped[] = "Expense to $paidTo, $date: amount was 0.";
                }
                continue;
            }
            if ($acct === '') {
                $count('expense_no_account');
            }
            $personId = $by !== '' ? $person($by) : null;
            $insert('expenses', [
                'date' => $date, 'paid_to' => $paidTo, 'amount' => lg_round($amount),
                'category_id' => $master('categories', lg_str($r['category'] ?? '') ?: 'Other'),
                'account_id' => $account($acct), 'person_id' => $personId,
                'remarks' => $joinNotes([lg_str($r['remarks'] ?? '', 2000), $by !== '' && !$personId ? "Paid by (old dashboard): $by" : '']),
            ]);
        }

        // ----- Amazon orders (cancel rows in the old file often have no date: use the order's other row)
        $orderDates = [];
        foreach (lg_list($old, 'amazon') as $r) {
            if (($d = lg_date($r['date'] ?? null)) && ($oid = lg_str($r['orderId'] ?? ''))) {
                $orderDates[$oid] ??= $d;
            }
        }
        $amazonIds = [];
        $nearby = lg_nearby_dates(lg_list($old, 'amazon'), $fallbackDate);
        // A refund only takes money off an order that was counted as shipped.
        $shipped = [];
        foreach (lg_list($old, 'amazon') as $r) {
            if (lg_status(lg_str($r['status'] ?? '')) === 'Shipment' && lg_num($r['amount'] ?? 0) > 0) {
                $shipped[lg_str($r['orderId'] ?? '', 60)] = true;
            }
        }
        // GST the old app put in its register for each Amazon row.
        $oldAutoGst = [];
        foreach (lg_list($old, 'gstSales') as $g) {
            if (!empty($g['auto']) && ($g['src'] ?? '') === 'amazon') {
                $oldAutoGst[lg_str($g['srcId'] ?? '')] = lg_num($g['gst'] ?? 0);
            }
        }
        // What the old app counted from orders that were cancelled or refunded (explains the figures below).
        $amazonOff = ['revenue' => 0.0, 'gst' => 0.0, 'orders' => 0];
        foreach (lg_list($old, 'amazon') as $i => $r) {
            $orderId = lg_str($r['orderId'] ?? '', 60) ?: 'OLD-' . ($i + 1);
            $date = lg_date($r['date'] ?? null);
            if (!$date) {
                $date = $orderDates[$orderId] ?? $nearby[$i];
                $count('amazon_date');
            }
            $status = lg_status(lg_str($r['status'] ?? ''));
            $amount = lg_num($r['amount'] ?? 0);
            $oldGst = $oldAutoGst[lg_str($r['id'] ?? '')] ?? 0.0;
            $row = [
                'date' => $date, 'order_id' => $orderId, 'customer' => lg_str($r['customer'] ?? '') ?: null, 'city' => lg_str($r['city'] ?? '', 120) ?: null,
                'status' => $status, 'invoice_no' => lg_str($r['invoice'] ?? '', 60) ?: null, 'gstin' => mb_strtoupper(lg_str($r['gstin'] ?? '', 20)) ?: null,
                'design_id' => $master('designs', lg_str($r['design'] ?? '')), 'location_id' => $master('locations', lg_str($r['loc'] ?? '')),
                'quantity' => (int) abs(round(lg_num($r['qty'] ?? 0))),
                'taxable' => lg_round(abs(lg_num($r['taxable'] ?? 0))), 'tax' => lg_round(abs(lg_num($r['tax'] ?? 0))), 'invoice_amount' => lg_round(abs($amount)),
                // Only orders the old app was feeding into GST sales keep doing so (the rest were typed in by hand there).
                'gst_sync' => lg_yes($r['gstSync'] ?? false) ? 1 : 0,
            ];
            if ($status === 'Shipment' && $amount < 0) {
                $note('Amazon', "Order $orderId: a shipment with a negative amount (₹$amount) — saved as a refund.");
                $row['status'] = 'Refund';
            } elseif ($status === 'Cancel' && $amount != 0) {
                // The order's status was changed to cancelled but its amount stayed, so the old app kept counting it.
                $note('Amazon', "Order $orderId was cancelled but still had ₹$amount, which the old dashboard counted as income. Here a cancelled order adds nothing.");
                $amazonOff['revenue'] += $amount;
                $amazonOff['gst'] += $oldGst;
                $amazonOff['orders']++;
            } elseif ($status === 'Refund' && $amount > 0 && !isset($shipped[$orderId])) {
                // Same, for an order marked refunded: it shipped and came back, so it is saved as both and nets to nothing.
                $note('Amazon', "Order $orderId was marked refunded with ₹$amount, which the old dashboard counted as income. It’s saved as shipped and then refunded, so it adds nothing.");
                $amazonIds[] = $insert('amazon_orders', ['status' => 'Shipment'] + $row);
                $amazonOff['revenue'] += $amount;
                $amazonOff['gst'] += $oldGst;
                $amazonOff['orders']++;
            } elseif ($status === 'Refund' && $amount > 0) {
                $note('Amazon', "Order $orderId: a refund with a positive amount (₹$amount). The old dashboard added it to revenue; here refunds are taken off.");
                $amazonOff['revenue'] += 2 * $amount;
                $amazonOff['gst'] += 2 * $oldGst;
                $amazonOff['orders']++;
            }
            $amazonIds[] = $insert('amazon_orders', $row);
        }

        // ----- samples
        $nearby = lg_nearby_dates(lg_list($old, 'samples'), $fallbackDate);
        foreach (lg_list($old, 'samples') as $i => $r) {
            $to = lg_str($r['to'] ?? '') ?: '(not recorded)';
            $date = lg_date($r['date'] ?? null) ?? $nearby[$i];
            $qty = (int) round(lg_num($r['qty'] ?? 0));
            if ($qty <= 0) {
                $skipped[] = "Sample to $to, $date: no quantity.";
                continue;
            }
            $by = lg_str($r['by'] ?? '', 120);
            $personId = $by !== '' ? $person($by) : null;
            $insert('samples', [
                'date' => $date, 'design_id' => $master('designs', lg_str($r['design'] ?? '')), 'location_id' => $master('locations', lg_str($r['loc'] ?? '')),
                'quantity' => $qty, 'given_to' => $to, 'person_id' => $personId,
                'remark' => $joinNotes([lg_str($r['remarks'] ?? '', 2000), $by !== '' && !$personId ? "Given by (old dashboard): $by" : '']),
            ]);
        }

        // ----- GST registers. Rows the old app generated from sales and Amazon orders are rebuilt from those below.
        $nearby = lg_nearby_dates(lg_list($old, 'gstPurchase'), $fallbackDate);
        foreach (lg_list($old, 'gstPurchase') as $i => $r) {
            $insert('gst_purchases', [
                'date' => lg_date($r['date'] ?? null) ?? $nearby[$i], 'supplier' => lg_str($r['party'] ?? '') ?: '(not recorded)',
                'gstin' => mb_strtoupper(lg_str($r['gstin'] ?? '', 20)) ?: null, 'invoice_no' => lg_str($r['invoice'] ?? '', 60) ?: null,
                'taxable' => lg_round(lg_num($r['taxable'] ?? 0)), 'gst' => lg_round(lg_num($r['gst'] ?? 0)),
                'total' => lg_round(lg_num($r['total'] ?? 0) ?: lg_num($r['taxable'] ?? 0) + lg_num($r['gst'] ?? 0)),
                'paid' => ($r['paid'] ?? '') === 'Paid' ? 'Paid' : 'Pending', 'remarks' => lg_str($r['remarks'] ?? '', 2000) ?: null,
            ]);
        }
        $autoGst = 0;
        $nearby = lg_nearby_dates(lg_list($old, 'gstSales'), $fallbackDate);
        foreach (lg_list($old, 'gstSales') as $i => $r) {
            if (!empty($r['auto'])) {
                $autoGst++;
                continue;
            }
            $insert('gst_sales', [
                'date' => lg_date($r['date'] ?? null) ?? $nearby[$i], 'party' => lg_str($r['party'] ?? '') ?: '(not recorded)',
                'gstin' => mb_strtoupper(lg_str($r['gstin'] ?? '', 20)) ?: null, 'invoice_no' => lg_str($r['invoice'] ?? '', 60) ?: null,
                'taxable' => lg_round(lg_num($r['taxable'] ?? 0)), 'gst' => lg_round(lg_num($r['gst'] ?? 0)),
                'total' => lg_round(lg_num($r['total'] ?? 0) ?: lg_num($r['taxable'] ?? 0) + lg_num($r['gst'] ?? 0)),
                'remarks' => lg_str($r['remarks'] ?? '', 2000) ?: null,
            ]);
        }
        foreach ($saleIds as $id) {
            sync_sale_gst($id);
        }
        foreach ($amazonIds as $id) {
            sync_amazon_gst($id);
        }

        // ----- balance adjustments
        foreach (lg_list($old, 'adjustments') as $r) {
            $amount = lg_num($r['amount'] ?? 0);
            if ($amount == 0) {
                continue;
            }
            $in = (($r['type'] ?? '') === 'in') === ($amount > 0);
            $text = lg_str($r['note'] ?? '', 2000);
            $insert('account_entries', [
                'date' => lg_date($r['date'] ?? null) ?? $fallbackDate, 'account_id' => $account(lg_str($r['acct'] ?? '', 120)),
                'direction' => $in ? 'in' : 'out', 'kind' => preg_match('/opening/i', $text) ? 'opening' : 'other', 'amount' => lg_round(abs($amount)), 'note' => $text ?: null,
            ]);
        }

        // ----- to-do list
        $todos = 0;
        foreach (lg_list($old, 'todos') as $r) {
            $title = lg_str($r['title'] ?? '', 255);
            if ($title === '') {
                continue;
            }
            $done = !empty($r['done']);
            $created = lg_date($r['created'] ?? null);
            $insert('todos', [
                'title' => $title, 'assignee' => lg_str($r['assignee'] ?? '', 120) ?: null,
                'priority' => in_array($r['priority'] ?? '', ['High', 'Medium', 'Low'], true) ? $r['priority'] : 'Medium',
                'due' => lg_date($r['due'] ?? null), 'notes' => lg_str($r['notes'] ?? '', 4000) ?: null,
                'done' => $done ? 1 : 0, 'done_on' => $done ? (lg_date($r['doneOn'] ?? null) ?? today()) : null,
            ] + ($created ? ['created_at' => "$created 00:00:00"] : []));
            $todos++;
        }

        // ----- stock. The old app kept stock as plain numbers it edited by hand. Records
        // above already take stock out here, so an opening entry per design and place
        // makes up the difference and every count lands exactly on the old number.
        $target = [];
        foreach ((is_array($old['stock'] ?? null) ? $old['stock'] : []) as $key => $value) {
            [$d, $l] = explode('|||', (string) $key, 2) + [1 => ''];
            $designId = $master('designs', lg_str($d));
            $locationId = $master('locations', lg_str($l));
            if (!$designId || !$locationId) {
                if (lg_num($value) != 0) {
                    $skipped[] = 'Stock of ' . (lg_str($d) ?: '(no design)') . ' at ' . (lg_str($l) ?: '(no location)') . ': ' . lg_num($value) . ' pieces with no design or location.';
                }
                continue;
            }
            $target[$designId][$locationId] = ($target[$designId][$locationId] ?? 0) + (int) round(lg_num($value));
        }
        $levels = stock_levels();
        $openings = 0;
        foreach (array_unique([...array_keys($target), ...array_keys($levels)]) as $designId) {
            $locs = array_unique([...array_keys($target[$designId] ?? []), ...array_keys($levels[$designId] ?? [])]);
            foreach ($locs as $locationId) {
                $diff = ($target[$designId][$locationId] ?? 0) - ($levels[$designId][$locationId] ?? 0);
                if ($diff !== 0) {
                    $insert('stock_adjustments', [
                        'date' => $openingDate, 'design_id' => $designId, 'location_id' => $locationId, 'mode' => $diff > 0 ? 'add' : 'remove',
                        'quantity' => abs($diff), 'reason' => 'Opening stock', 'note' => 'Brought over from the old dashboard so this count matches it.',
                    ]);
                    $openings++;
                }
            }
        }

        // ----- money with no account. It sits in one archived account, set back to zero,
        // so balances match the old app (which left it out). Choosing the real account
        // on a sale or expense later moves that money where it belongs.
        if ($unspecified) {
            $bal = 0.0;
            foreach (balances()['accounts'] as $a) {
                if ($a['account_id'] === $unspecified) {
                    $bal = $a['balance'];
                }
            }
            if (abs($bal) > 0.004) {
                $insert('account_entries', [
                    'date' => today(), 'account_id' => $unspecified, 'direction' => $bal > 0 ? 'out' : 'in', 'kind' => 'correction', 'amount' => lg_round(abs($bal)),
                    'note' => 'The old dashboard didn’t count money recorded without an account. This keeps balances the same as it showed.',
                ]);
            }
        }

        // ----- history (the old audit trail), kept with its original times and users
        $history = 0;
        $actions = ['added' => 'added', 'edited' => 'edited', 'deleted' => 'deleted'];
        foreach (lg_list($old, 'audit') as $r) {
            try {
                $at = (new DateTimeImmutable(lg_str($r['ts'] ?? '')))->setTimezone(new DateTimeZone('Asia/Kolkata'))->format('Y-m-d H:i:s');
            } catch (Exception) {
                continue;
            }
            $tab = lg_str($r['tab'] ?? '', 60);
            q('INSERT INTO activity_log (at, user_id, action, entity, entity_id, summary, data) VALUES (?, NULL, ?, ?, NULL, ?, ?)', [
                $at, $actions[mb_strtolower(lg_str($r['action'] ?? ''))] ?? 'edited', 'legacy',
                mb_substr(($tab ? "$tab · " : '') . lg_str($r['detail'] ?? '', 255), 0, 255),
                json_encode(['user' => lg_str($r['user'] ?? '') ?: 'Old dashboard', 'tab' => $tab], JSON_UNESCAPED_UNICODE),
            ]);
            $history++;
        }

        // ----- notes said once, with a count
        $plural = fn (int $n, string $one, string $many) => $n . ' ' . ($n === 1 ? $one : $many);
        if ($n = $tally['sale_no_account'] ?? 0) {
            $note('Money', $plural($n, 'sale payment', 'sale payments') . ' had no account. They are under “' . LEGACY_UNSPECIFIED . '”, which is left out of money on hand like the old dashboard did. Open a sale and choose its account to move the money there.');
        }
        if ($n = $tally['expense_no_account'] ?? 0) {
            $note('Money', $plural($n, 'expense', 'expenses') . ' had no account. They are under “' . LEGACY_UNSPECIFIED . '” too (the old “Paid by” name is kept as the person or in the remarks).');
        }
        if ($n = $tally['amazon_date'] ?? 0) {
            $note('Amazon', $plural($n, 'order row has', 'order rows have') . ' no date in the old dashboard (mostly cancellations). Each takes the date of the same order, or of the row next to it.');
        }
        if ($n = $tally['sale_date'] ?? 0) {
            $note('Sales', $plural($n, 'sale has', 'sales have') . ' no date in the old dashboard. Each takes the date of the sale next to it.');
        }
        if ($autoGst) {
            $note('GST', $plural($autoGst, 'GST sales line', 'GST sales lines') . ' that the old dashboard made from sales and Amazon orders were rebuilt from those records, and will keep updating with them.');
        }
        if ($openings) {
            $note('Stock', $plural($openings, 'opening stock entry', 'opening stock entries') . " dated $openingDate set each design and place to the count the old dashboard had.");
        }

        $counts = [
            'sales' => (int) scalar('SELECT COUNT(*) FROM sales'),
            'payments' => (int) scalar('SELECT COUNT(*) FROM sale_payments'),
            'expenses' => (int) scalar('SELECT COUNT(*) FROM expenses'),
            'amazon_orders' => (int) scalar('SELECT COUNT(*) FROM amazon_orders'),
            'samples' => (int) scalar('SELECT COUNT(*) FROM samples'),
            'gst_purchases' => (int) scalar('SELECT COUNT(*) FROM gst_purchases'),
            'gst_sales' => (int) scalar('SELECT COUNT(*) FROM gst_sales'),
            'adjustments' => (int) scalar('SELECT COUNT(*) FROM account_entries'),
            'todos' => $todos,
            'history' => $history,
            'designs' => count($ids['designs']), 'locations' => count($ids['locations']), 'accounts' => count($ids['accounts']),
            'categories' => count($ids['categories']), 'people' => count($ids['people']),
        ];
        $source = [
            'sales' => count(lg_list($old, 'sales')), 'expenses' => count(lg_list($old, 'expenses')), 'amazon_orders' => count(lg_list($old, 'amazon')),
            'samples' => count(lg_list($old, 'samples')), 'gst_purchases' => count(lg_list($old, 'gstPurchase')), 'gst_sales' => count(lg_list($old, 'gstSales')),
            'adjustments' => count(lg_list($old, 'adjustments')), 'todos' => count(lg_list($old, 'todos')), 'history' => count(lg_list($old, 'audit')),
        ];

        $before = legacy_totals($old);
        $after = current_totals();
        $figures = [];
        foreach (LEGACY_FIGURES as $k => [$label, $kind]) {
            $diff = $after[$k] - $before[$k];
            $explain = null;
            if ($k === 'sales_total' && abs($diff) >= 0.01 && abs($diff - array_sum($recalculated)) < 0.01) {
                $explain = $plural(count($recalculated), 'sale', 'sales') . ' had a total that wasn’t quantity × price + freight in the old dashboard (usually freight left out). See the notes below.';
            }
            $off = ['amazon_revenue' => $amazonOff['revenue'], 'gst_output' => $amazonOff['gst']][$k] ?? 0.0;
            if ($off != 0 && abs($diff + $off) < 0.01) {
                $explain = 'The old dashboard still counted ' . $plural($amazonOff['orders'], 'Amazon order', 'Amazon orders') . ' that ' . ($amazonOff['orders'] === 1 ? 'was' : 'were')
                    . ' cancelled or refunded' . ($k === 'gst_output' ? ' in its GST sales' : '') . '. See the notes below.';
            }
            $figures[] = ['key' => $k, 'label' => $label, 'kind' => $kind, 'old' => lg_round($before[$k]), 'new' => lg_round($after[$k]), 'match' => abs($diff) < 0.01, 'explain' => $explain];
        }

        $result = ['dry_run' => $dry, 'counts' => $counts, 'source' => $source, 'figures' => $figures, 'notes' => $notes, 'skipped' => $skipped];
        if ($dry) {
            db()->rollBack();
            return $result;
        }
        $summary = ['at' => now(), 'by' => current_user()['name'] ?? null, 'counts' => $counts];
        q("INSERT INTO settings (k, v) VALUES ('legacy_import', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)", [json_encode($summary, JSON_UNESCAPED_UNICODE)]);
        log_activity('imported', 'legacy', null, "Brought over {$counts['sales']} sales, {$counts['expenses']} expenses and {$counts['amazon_orders']} Amazon orders from the old dashboard");
        db()->commit();
        return $result;
    } catch (Throwable $e) {
        if (db()->inTransaction()) {
            db()->rollBack();
        }
        throw $e;
    }
}
