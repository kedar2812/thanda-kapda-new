<?php
// Everything here is derived from the transaction tables on every request.
// Nothing is cached, so edits and deletes are always reflected exactly.

declare(strict_types=1);

// ---------------------------------------------------------------- stock

/**
 * Every stock movement, oldest first. qty is the signed change; for a "set"
 * count, qty is the target and set = true.
 */
function stock_movements(?int $designId = null, ?int $locationId = null): array
{
    $m = [];
    $add = function (array $r, string $type, int $loc, int $qty, string $label, bool $set = false) use (&$m) {
        $m[] = [
            'type' => $type, 'id' => (int) $r['id'], 'date' => $r['date'], 'created_at' => $r['created_at'],
            'design_id' => (int) $r['design_id'], 'location_id' => $loc, 'qty' => $qty, 'set' => $set, 'label' => $label,
        ];
    };

    foreach (rows('SELECT id, date, created_at, design_id, location_id, mode, quantity, reason FROM stock_adjustments') as $r) {
        $q = (int) $r['quantity'];
        $add($r, 'stock_adjustments', (int) $r['location_id'], $r['mode'] === 'remove' ? -$q : $q, ucfirst($r['reason']), $r['mode'] === 'set');
    }
    foreach (rows('SELECT t.id, t.date, t.created_at, t.design_id, t.from_location_id, t.to_location_id, t.quantity, lf.name AS f, lt.name AS t2
                   FROM stock_transfers t JOIN locations lf ON lf.id = t.from_location_id JOIN locations lt ON lt.id = t.to_location_id') as $r) {
        $q = (int) $r['quantity'];
        $add($r, 'stock_transfers', (int) $r['from_location_id'], -$q, "Moved to {$r['t2']}");
        $add($r, 'stock_transfers', (int) $r['to_location_id'], $q, "Moved from {$r['f']}");
    }
    foreach (rows('SELECT id, date, created_at, design_id, location_id, quantity, party FROM sales WHERE design_id IS NOT NULL AND location_id IS NOT NULL AND quantity > 0') as $r) {
        $add($r, 'sales', (int) $r['location_id'], -(int) $r['quantity'], "Sale to {$r['party']}");
    }
    foreach (rows('SELECT id, date, created_at, design_id, location_id, quantity, given_to FROM samples') as $r) {
        $add($r, 'samples', (int) $r['location_id'], -(int) $r['quantity'], "Sample to {$r['given_to']}");
    }
    foreach (rows("SELECT id, date, created_at, design_id, location_id, quantity, order_id FROM amazon_orders
                   WHERE status = 'Shipment' AND design_id IS NOT NULL AND location_id IS NOT NULL AND quantity > 0") as $r) {
        $add($r, 'amazon_orders', (int) $r['location_id'], -(int) $r['quantity'], "Amazon order {$r['order_id']}");
    }

    if ($designId !== null) {
        $m = array_values(array_filter($m, fn ($x) => $x['design_id'] === $designId && ($locationId === null || $x['location_id'] === $locationId)));
    }
    usort($m, fn ($a, $b) => [$a['date'], $a['created_at'], $a['id']] <=> [$b['date'], $b['created_at'], $b['id']]);
    return $m;
}

/** Current stock as [design_id][location_id] => qty. */
function stock_levels(): array
{
    $grid = [];
    foreach (stock_movements() as $x) {
        $cur = $grid[$x['design_id']][$x['location_id']] ?? 0;
        $grid[$x['design_id']][$x['location_id']] = $x['set'] ? $x['qty'] : $cur + $x['qty'];
    }
    return $grid;
}

function stock_grid(): array
{
    $cells = [];
    foreach (stock_levels() as $d => $locs) {
        foreach ($locs as $l => $qty) {
            $cells[] = ['design_id' => $d, 'location_id' => $l, 'qty' => $qty];
        }
    }
    return ['cells' => $cells];
}

function stock_history(int $designId, int $locationId): array
{
    $bal = 0;
    $out = [];
    foreach (stock_movements($designId, $locationId) as $x) {
        $change = $x['set'] ? $x['qty'] - $bal : $x['qty'];
        $bal = $x['set'] ? $x['qty'] : $bal + $x['qty'];
        $out[] = ['type' => $x['type'], 'id' => $x['id'], 'date' => $x['date'], 'label' => $x['label'] . ($x['set'] ? ' (count set to ' . $x['qty'] . ')' : ''), 'change' => $change, 'balance' => $bal];
    }
    return array_reverse($out);
}

// ---------------------------------------------------------------- money

/** Every money movement touching accounts, as signed amounts. */
function money_movements(?int $accountId = null): array
{
    $m = [];
    $push = function (string $type, int $id, string $date, string $createdAt, int $acc, float $amt, string $label) use (&$m) {
        $m[] = ['type' => $type, 'id' => $id, 'date' => $date, 'created_at' => $createdAt, 'account_id' => $acc, 'amount' => round($amt, 2), 'label' => $label];
    };

    foreach (rows('SELECT p.id, p.sale_id, p.date, p.created_at, p.account_id, p.amount, s.party FROM sale_payments p JOIN sales s ON s.id = p.sale_id') as $r) {
        $push('sales', (int) $r['sale_id'], $r['date'], $r['created_at'], (int) $r['account_id'], (float) $r['amount'], "Payment from {$r['party']}");
    }
    foreach (rows('SELECT id, date, created_at, account_id, amount, paid_to FROM expenses') as $r) {
        $push('expenses', (int) $r['id'], $r['date'], $r['created_at'], (int) $r['account_id'], -(float) $r['amount'], "Expense: {$r['paid_to']}");
    }
    foreach (rows('SELECT id, date, created_at, account_id, amount, reference FROM amazon_settlements') as $r) {
        $push('amazon_settlements', (int) $r['id'], $r['date'], $r['created_at'], (int) $r['account_id'], (float) $r['amount'], 'Amazon payout' . ($r['reference'] ? " {$r['reference']}" : ''));
    }
    $kinds = ['opening' => 'Opening balance', 'capital' => 'Capital put in', 'withdrawal' => 'Withdrawal', 'correction' => 'Correction', 'other' => 'Adjustment'];
    foreach (rows('SELECT id, date, created_at, account_id, direction, kind, amount, note FROM account_entries') as $r) {
        $sign = $r['direction'] === 'in' ? 1 : -1;
        $push('account_entries', (int) $r['id'], $r['date'], $r['created_at'], (int) $r['account_id'], $sign * (float) $r['amount'], $kinds[$r['kind']] . ($r['note'] ? " · {$r['note']}" : ''));
    }
    foreach (rows('SELECT t.id, t.date, t.created_at, t.from_account_id, t.to_account_id, t.amount, af.name AS f, at.name AS t2
                   FROM account_transfers t JOIN accounts af ON af.id = t.from_account_id JOIN accounts at ON at.id = t.to_account_id') as $r) {
        $push('account_transfers', (int) $r['id'], $r['date'], $r['created_at'], (int) $r['from_account_id'], -(float) $r['amount'], "Transfer to {$r['t2']}");
        $push('account_transfers', (int) $r['id'], $r['date'], $r['created_at'], (int) $r['to_account_id'], (float) $r['amount'], "Transfer from {$r['f']}");
    }

    if ($accountId !== null) {
        $m = array_values(array_filter($m, fn ($x) => $x['account_id'] === $accountId));
    }
    usort($m, fn ($a, $b) => [$a['date'], $a['created_at'], $a['id']] <=> [$b['date'], $b['created_at'], $b['id']]);
    return $m;
}

function balances(): array
{
    $acc = [];
    foreach (rows('SELECT id FROM accounts') as $a) {
        $acc[(int) $a['id']] = ['account_id' => (int) $a['id'], 'money_in' => 0.0, 'money_out' => 0.0, 'adjustments' => 0.0, 'balance' => 0.0];
    }
    foreach (money_movements() as $x) {
        $a = &$acc[$x['account_id']];
        if ($x['type'] === 'account_entries') {
            $a['adjustments'] += $x['amount'];
        } elseif ($x['amount'] >= 0) {
            $a['money_in'] += $x['amount'];
        } else {
            $a['money_out'] += -$x['amount'];
        }
        $a['balance'] += $x['amount'];
        unset($a);
    }
    $list = array_map(fn ($a) => array_map(fn ($v) => is_float($v) ? round($v, 2) : $v, $a), array_values($acc));
    return ['accounts' => $list, 'total' => round(array_sum(array_column($list, 'balance')), 2)];
}

function statement(int $accountId): array
{
    $bal = 0.0;
    $out = [];
    foreach (money_movements($accountId) as $x) {
        $bal = round($bal + $x['amount'], 2);
        $x['balance'] = $bal;
        $out[] = $x;
    }
    return array_reverse($out);
}

// ---------------------------------------------------------------- receivables

function ageing(): array
{
    $today = new DateTimeImmutable(today());
    $unpaid = array_values(array_filter(list_sales(), fn ($s) => $s['balance'] > 0.004));
    $buckets = ['0–30' => [0, 0.0], '31–60' => [0, 0.0], '61–90' => [0, 0.0], '90+' => [0, 0.0]];
    $byCustomer = [];
    foreach ($unpaid as &$s) {
        $days = (int) (new DateTimeImmutable($s['date']))->diff($today)->format('%r%a');
        $s['days'] = max(0, $days);
        $key = $days <= 30 ? '0–30' : ($days <= 60 ? '31–60' : ($days <= 90 ? '61–90' : '90+'));
        $buckets[$key][0]++;
        $buckets[$key][1] += $s['balance'];
        $c = mb_strtolower(trim($s['party']));
        $byCustomer[$c] ??= ['party' => trim($s['party']), 'amount' => 0.0, 'count' => 0];
        $byCustomer[$c]['amount'] += $s['balance'];
        $byCustomer[$c]['count']++;
    }
    unset($s);
    usort($unpaid, fn ($a, $b) => [$a['date'], $a['id']] <=> [$b['date'], $b['id']]);
    $customers = array_values($byCustomer);
    usort($customers, fn ($a, $b) => $b['amount'] <=> $a['amount']);

    return [
        'total' => round(array_sum(array_column($unpaid, 'balance')), 2),
        'count' => count($unpaid),
        'oldest_days' => $unpaid ? $unpaid[0]['days'] : 0,
        'buckets' => array_map(fn ($k, $v) => ['label' => $k, 'count' => $v[0], 'amount' => round($v[1], 2)], array_keys($buckets), $buckets),
        'customers' => array_map(fn ($c) => ['party' => $c['party'], 'count' => $c['count'], 'amount' => round($c['amount'], 2)], $customers),
        'sales' => $unpaid,
    ];
}

// ---------------------------------------------------------------- dashboard

function in_range(string $date, ?string $from, ?string $to): bool
{
    return (!$from || $date >= $from) && (!$to || $date <= $to);
}

function dashboard(?string $from, ?string $to): array
{
    $sales = array_values(array_filter(list_sales(), fn ($s) => in_range($s['date'], $from, $to)));
    $salesTotal = array_sum(array_column($sales, 'total'));

    $received = 0.0;
    foreach (rows('SELECT date, amount FROM sale_payments') as $p) {
        if (in_range($p['date'], $from, $to)) {
            $received += (float) $p['amount'];
        }
    }

    $expenses = 0.0;
    $byCategory = [];
    foreach (rows('SELECT date, amount, category_id FROM expenses') as $e) {
        if (in_range($e['date'], $from, $to)) {
            $expenses += (float) $e['amount'];
            $byCategory[(int) $e['category_id']] = ($byCategory[(int) $e['category_id']] ?? 0) + (float) $e['amount'];
        }
    }

    $amazon = 0.0;
    $amazonOrders = 0;
    foreach (rows("SELECT date, invoice_amount FROM amazon_orders WHERE status = 'Shipment'") as $o) {
        if (in_range($o['date'], $from, $to)) {
            $amazon += (float) $o['invoice_amount'];
            $amazonOrders++;
        }
    }
    $fees = 0.0;
    foreach (rows('SELECT date, fees FROM amazon_settlements') as $s) {
        if (in_range($s['date'], $from, $to)) {
            $fees += (float) $s['fees'];
        }
    }

    $samples = 0;
    foreach (rows('SELECT date, quantity FROM samples') as $s) {
        if (in_range($s['date'], $from, $to)) {
            $samples += (int) $s['quantity'];
        }
    }

    // Stock and money on hand are always "as of now".
    $stockByDesign = [];
    foreach (stock_levels() as $d => $locs) {
        $stockByDesign[$d] = array_sum($locs);
    }

    $customers = [];
    foreach ($sales as $s) {
        $k = mb_strtolower(trim($s['party']));
        $customers[$k] ??= ['party' => trim($s['party']), 'amount' => 0.0];
        $customers[$k]['amount'] += $s['total'];
    }
    usort($customers, fn ($a, $b) => $b['amount'] <=> $a['amount']);

    return [
        'money_on_hand' => balances()['total'],
        'sales_total' => round($salesTotal, 2),
        'expenses' => round($expenses, 2),
        'amazon_revenue' => round($amazon, 2),
        'amazon_orders' => $amazonOrders,
        'amazon_fees' => round($fees, 2),
        'profit' => round($salesTotal + $amazon - $fees - $expenses, 2),
        'received' => round($received, 2),
        'outstanding' => round(array_sum(array_map(fn ($s) => max(0, $s['balance']), $sales)), 2),
        'samples' => $samples,
        'stock_total' => array_sum($stockByDesign),
        'stock_by_design' => array_map(fn ($d, $q) => ['design_id' => $d, 'qty' => $q], array_keys($stockByDesign), $stockByDesign),
        'expenses_by_category' => array_map(fn ($c, $a) => ['category_id' => $c, 'amount' => round($a, 2)], array_keys($byCategory), $byCategory),
        'top_customers' => array_map(fn ($c) => ['party' => $c['party'], 'amount' => round($c['amount'], 2)], array_slice($customers, 0, 5)),
        'trend' => monthly_trend(),
    ];
}

/** Last 12 months of income (direct + Amazon) against expenses. */
function monthly_trend(): array
{
    $months = [];
    $start = new DateTimeImmutable(date('Y-m-01', strtotime(today())));
    for ($i = 11; $i >= 0; $i--) {
        $months[$start->modify("-$i month")->format('Y-m')] = ['income' => 0.0, 'expenses' => 0.0];
    }
    foreach (list_sales() as $s) {
        $m = substr($s['date'], 0, 7);
        if (isset($months[$m])) {
            $months[$m]['income'] += $s['total'];
        }
    }
    foreach (rows("SELECT date, invoice_amount FROM amazon_orders WHERE status = 'Shipment'") as $o) {
        $m = substr($o['date'], 0, 7);
        if (isset($months[$m])) {
            $months[$m]['income'] += (float) $o['invoice_amount'];
        }
    }
    foreach (rows('SELECT date, amount FROM expenses') as $e) {
        $m = substr($e['date'], 0, 7);
        if (isset($months[$m])) {
            $months[$m]['expenses'] += (float) $e['amount'];
        }
    }
    return array_map(fn ($m, $v) => ['month' => $m, 'income' => round($v['income'], 2), 'expenses' => round($v['expenses'], 2)], array_keys($months), $months);
}

// ---------------------------------------------------------------- GST

function gst_summary(): array
{
    $months = [];
    foreach (['gst_sales' => 'output', 'gst_purchases' => 'input'] as $table => $side) {
        foreach (rows("SELECT DATE_FORMAT(date, '%Y-%m') AS m, SUM(taxable) AS taxable, SUM(gst) AS gst FROM $table GROUP BY m") as $r) {
            $months[$r['m']] ??= ['month' => $r['m'], 'output' => 0.0, 'input' => 0.0, 'output_taxable' => 0.0, 'input_taxable' => 0.0];
            $months[$r['m']][$side] = round((float) $r['gst'], 2);
            $months[$r['m']][$side . '_taxable'] = round((float) $r['taxable'], 2);
        }
    }
    krsort($months);
    return array_values(array_map(fn ($m) => $m + ['net' => round($m['output'] - $m['input'], 2)], $months));
}
