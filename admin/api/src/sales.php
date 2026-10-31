<?php
// Direct sales carry a list of payments (instalments), each into an account.
// A sale can carry GST: the customer owes goods + freight + GST.

declare(strict_types=1);

const GST_RATES = [0, 3, 5, 12, 18, 28];

/** Goods + freight, before GST. */
function sale_subtotal(array $s): float
{
    return round($s['quantity'] * $s['price'] + $s['freight'], 2);
}

function sale_gst(array $s): float
{
    return round(sale_subtotal($s) * (float) ($s['gst_rate'] ?? 0) / 100, 2);
}

/** What the customer owes, including GST. */
function sale_total(array $s): float
{
    return round(sale_subtotal($s) + sale_gst($s), 2);
}

function enrich_sales(array $sales): array
{
    if (!$sales) {
        return [];
    }
    $ids = array_column($sales, 'id');
    $in = implode(',', array_fill(0, count($ids), '?'));
    $byId = [];
    foreach (rows("SELECT id, sale_id, date, amount, account_id FROM sale_payments WHERE sale_id IN ($in) ORDER BY date, id", $ids) as $p) {
        $byId[(int) $p['sale_id']][] = [
            'id' => (int) $p['id'],
            'date' => $p['date'],
            'amount' => round((float) $p['amount'], 2),
            'account_id' => (int) $p['account_id'],
        ];
    }
    foreach ($sales as &$s) {
        $s['payments'] = $byId[$s['id']] ?? [];
        $s['subtotal'] = sale_subtotal($s);
        $s['gst'] = sale_gst($s);
        $s['total'] = sale_total($s);
        $s['received'] = round(array_sum(array_column($s['payments'], 'amount')), 2);
        $s['balance'] = round($s['total'] - $s['received'], 2);
        $s['status'] = $s['balance'] <= 0.004 ? 'paid' : ($s['received'] > 0 ? 'partial' : 'unpaid');
    }
    return $sales;
}

function list_sales(): array
{
    return enrich_sales(list_rows('sales'));
}

function get_sale(int $id): array
{
    return enrich_sales([get_row('sales', $id)])[0];
}

function clean_payments(array $in): array
{
    $out = [];
    foreach (($in['payments'] ?? []) as $i => $p) {
        $n = $i + 1;
        $amount = $p['amount'] ?? '';
        if ($amount === '' || $amount === null) {
            continue; // blank row the user left in the form
        }
        if (!is_numeric($amount) || (float) $amount < 0) {
            throw new HttpError(422, "Payment $n: the amount must be a positive number.", 'validation');
        }
        $account = $p['account_id'] ?? null;
        if (!$account || !scalar('SELECT id FROM accounts WHERE id = ?', [(int) $account])) {
            throw new HttpError(422, "Payment $n: please choose which account the money went into.", 'validation');
        }
        $date = ($p['date'] ?? '') ?: today();
        if (!DateTimeImmutable::createFromFormat('!Y-m-d', $date)) {
            throw new HttpError(422, "Payment $n: the date is not valid.", 'validation');
        }
        $out[] = ['date' => $date, 'amount' => round((float) $amount, 2), 'account_id' => (int) $account];
    }
    return $out;
}

function save_sale(?int $id): array
{
    $in = input();
    $data = clean_payload('sales', $in);
    if (!in_array((float) $data['gst_rate'], array_map('floatval', GST_RATES), true)) {
        throw new HttpError(422, 'Please choose a GST rate of ' . implode(', ', array_slice(GST_RATES, 1)) . '% or none.', 'validation');
    }
    $payments = clean_payments($in);

    $total = sale_total($data);
    $received = array_sum(array_column($payments, 'amount'));
    if ($received - $total > 0.004 && empty($in['confirm_overpay'])) {
        throw new HttpError(422, 'The money received is more than the sale total. Did the customer overpay?', 'overpay');
    }

    db()->beginTransaction();
    try {
        $sale = $id === null
            ? create_row('sales', $data)
            : update_row('sales', $id, $data, $in['updated_at'] ?? null);

        // Replace the payment list with what the form sent.
        q('DELETE FROM sale_payments WHERE sale_id = ?', [$sale['id']]);
        $ts = now();
        foreach ($payments as $p) {
            q(
                'INSERT INTO sale_payments (sale_id, date, amount, account_id, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [$sale['id'], $p['date'], $p['amount'], $p['account_id'], $ts, uid(), $ts, uid()]
            );
        }
        sync_sale_gst($sale['id']);
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
    return get_sale($sale['id']);
}
