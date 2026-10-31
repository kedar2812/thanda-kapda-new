<?php
// The GST sales register fills itself from sales that carry GST and from
// Amazon orders that carry tax, the way the old dashboard did. Those rows are
// marked auto and follow their source; rows typed in by hand are never touched.

declare(strict_types=1);

function upsert_auto_gst(string $column, int $sourceId, ?array $row): void
{
    $existing = scalar("SELECT id FROM gst_sales WHERE $column = ? AND auto = 1", [$sourceId]);
    if ($row === null) {
        if ($existing) {
            q('DELETE FROM gst_sales WHERE id = ?', [$existing]);
        }
        return;
    }
    $ts = now();
    $row += [$column => $sourceId, 'auto' => 1, 'updated_at' => $ts, 'updated_by' => uid()];
    if ($existing) {
        $sets = implode(',', array_map(fn ($c) => "$c = ?", array_keys($row)));
        q("UPDATE gst_sales SET $sets WHERE id = ?", [...array_values($row), $existing]);
    } else {
        $row += ['created_at' => $ts, 'created_by' => uid()];
        $cols = array_keys($row);
        q('INSERT INTO gst_sales (' . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')', array_values($row));
    }
}

function sync_sale_gst(int $saleId): void
{
    $s = one('SELECT * FROM sales WHERE id = ?', [$saleId]);
    if (!$s || (float) $s['gst_rate'] <= 0) {
        upsert_auto_gst('sale_id', $saleId, null);
        return;
    }
    $s = ['quantity' => (int) $s['quantity'], 'price' => (float) $s['price'], 'freight' => (float) $s['freight']] + $s;
    $taxable = sale_subtotal($s);
    $gst = sale_gst($s);
    upsert_auto_gst('sale_id', $saleId, [
        'date' => $s['date'], 'party' => $s['party'], 'gstin' => $s['gstin'], 'invoice_no' => $s['invoice_no'],
        'taxable' => $taxable, 'gst' => $gst, 'total' => round($taxable + $gst, 2),
        'remarks' => 'From the sale · ' . rtrim(rtrim(number_format((float) $s['gst_rate'], 2), '0'), '.') . '% GST',
    ]);
}

/** Shipped orders add output GST; refunds take it back off (as a negative line). */
function sync_amazon_gst(int $orderId): void
{
    $o = one('SELECT * FROM amazon_orders WHERE id = ?', [$orderId]);
    if (!$o || !$o['gst_sync'] || (float) $o['tax'] == 0.0 || $o['status'] === 'Cancel') {
        upsert_auto_gst('amazon_order_id', $orderId, null);
        return;
    }
    $sign = $o['status'] === 'Refund' ? -1 : 1;
    $tax = (float) $o['tax'];
    $taxable = (float) $o['taxable'] ?: (float) $o['invoice_amount'] - $tax;
    upsert_auto_gst('amazon_order_id', $orderId, [
        'date' => $o['date'], 'party' => $o['customer'] ?: 'Amazon customer', 'gstin' => $o['gstin'],
        'invoice_no' => $o['invoice_no'] ?: $o['order_id'],
        'taxable' => $sign * round($taxable, 2), 'gst' => $sign * round($tax, 2), 'total' => $sign * round($taxable + $tax, 2),
        'remarks' => $o['status'] === 'Refund' ? "Amazon refund · order {$o['order_id']}" : "Amazon order {$o['order_id']}",
    ]);
}

/** GST sales with whether the money has come in (from the linked sale; others count as paid). */
function list_gst_sales(): array
{
    $status = [];
    foreach (list_sales() as $s) {
        $status[$s['id']] = $s['status'] === 'paid' ? 'Paid' : 'Unpaid';
    }
    return array_map(function ($r) use ($status) {
        $r['paid'] = $r['sale_id'] && isset($status[$r['sale_id']]) ? $status[$r['sale_id']] : 'Paid';
        return $r;
    }, list_rows('gst_sales'));
}
