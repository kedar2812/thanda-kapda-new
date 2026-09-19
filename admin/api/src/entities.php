<?php
// Every record type the dashboard stores, and the generic create/update/delete
// logic that validates and logs them.
//
// Field types: date, int, money, str, text, fk:<table>, enum:<a|b>.
// A trailing "!" on the type marks the field as required.

declare(strict_types=1);

const MASTER_TABLES = ['designs', 'locations', 'accounts', 'categories', 'people'];

function entities(): array
{
    static $e = null;
    if ($e !== null) {
        return $e;
    }
    $master = fn (string $label, array $extra = []) => [
        'label' => $label,
        'master' => true,
        'fields' => ['name' => ['str!', 'Name'], 'sort' => ['int', 'Order']] + $extra,
    ];

    $e = [
        'designs' => $master('Design', ['low_stock' => ['int', 'Low stock warning']]),
        'locations' => $master('Location'),
        'accounts' => $master('Money account'),
        'categories' => $master('Expense category'),
        'people' => $master('Person'),

        'sales' => [
            'label' => 'Sale',
            'describe' => fn ($r) => "{$r['party']} · {$r['quantity']} pcs",
            'fields' => [
                'date' => ['date!', 'Date'],
                'party' => ['str!', 'Customer'],
                'design_id' => ['fk:designs', 'Design'],
                'location_id' => ['fk:locations', 'Stock taken from'],
                'quantity' => ['int', 'Quantity'],
                'price' => ['money', 'Price per piece'],
                'freight' => ['money', 'Freight'],
                'person_id' => ['fk:people', 'Handled by'],
                'notes' => ['text', 'Notes'],
            ],
        ],
        'samples' => [
            'label' => 'Sample',
            'describe' => fn ($r) => "{$r['quantity']} pcs to {$r['given_to']}",
            'fields' => [
                'date' => ['date!', 'Date'],
                'design_id' => ['fk:designs!', 'Design'],
                'location_id' => ['fk:locations!', 'Stock taken from'],
                'quantity' => ['int!', 'Quantity'],
                'given_to' => ['str!', 'Given to'],
                'person_id' => ['fk:people', 'Given by'],
                'remark' => ['text', 'Remark'],
            ],
        ],
        'expenses' => [
            'label' => 'Expense',
            'describe' => fn ($r) => "₹{$r['amount']} to {$r['paid_to']}",
            'fields' => [
                'date' => ['date!', 'Date'],
                'paid_to' => ['str!', 'Paid to'],
                'amount' => ['money!', 'Amount'],
                'category_id' => ['fk:categories!', 'Category'],
                'account_id' => ['fk:accounts!', 'Paid from account'],
                'person_id' => ['fk:people', 'Paid by'],
                'remarks' => ['text', 'Remarks'],
            ],
        ],
        'amazon_orders' => [
            'label' => 'Amazon order',
            'describe' => fn ($r) => "Order {$r['order_id']} ({$r['status']})",
            'fields' => [
                'date' => ['date!', 'Date'],
                'order_id' => ['str!', 'Order ID'],
                'customer' => ['str', 'Customer'],
                'city' => ['str', 'City'],
                'status' => ['enum:Shipment|Cancel|Refund!', 'Status'],
                'invoice_no' => ['str', 'Invoice no.'],
                'design_id' => ['fk:designs', 'Design'],
                'location_id' => ['fk:locations', 'Shipped from'],
                'quantity' => ['int', 'Quantity'],
                'taxable' => ['money', 'Taxable value'],
                'tax' => ['money', 'Total tax'],
                'invoice_amount' => ['money', 'Invoice amount'],
            ],
        ],
        'amazon_settlements' => [
            'label' => 'Amazon payout',
            'describe' => fn ($r) => "₹{$r['amount']} payout",
            'fields' => [
                'date' => ['date!', 'Date'],
                'account_id' => ['fk:accounts!', 'Received into'],
                'amount' => ['money!', 'Amount received'],
                'fees' => ['money', 'Amazon fees deducted'],
                'reference' => ['str', 'Reference'],
                'note' => ['text', 'Note'],
            ],
        ],
        'gst_purchases' => [
            'label' => 'GST purchase',
            'describe' => fn ($r) => "{$r['supplier']} · inv {$r['invoice_no']}",
            'fields' => [
                'date' => ['date!', 'Date'],
                'supplier' => ['str!', 'Supplier'],
                'gstin' => ['str', 'Supplier GSTIN'],
                'invoice_no' => ['str', 'Invoice no.'],
                'taxable' => ['money', 'Taxable value'],
                'gst' => ['money', 'GST amount'],
                'total' => ['money', 'Total'],
            ],
        ],
        'gst_sales' => [
            'label' => 'GST sale',
            'describe' => fn ($r) => "{$r['party']} · inv {$r['invoice_no']}",
            'fields' => [
                'date' => ['date!', 'Date'],
                'party' => ['str!', 'Party'],
                'gstin' => ['str', 'Party GSTIN'],
                'invoice_no' => ['str', 'Invoice no.'],
                'taxable' => ['money', 'Taxable value'],
                'gst' => ['money', 'GST amount'],
                'total' => ['money', 'Total'],
                'sale_id' => ['fk:sales', 'Linked sale'],
            ],
        ],
        'account_entries' => [
            'label' => 'Balance adjustment',
            'describe' => fn ($r) => "{$r['direction']} ₹{$r['amount']}",
            'fields' => [
                'date' => ['date!', 'Date'],
                'account_id' => ['fk:accounts!', 'Account'],
                'direction' => ['enum:in|out!', 'Money in or out'],
                'kind' => ['enum:opening|capital|withdrawal|correction|other!', 'Type'],
                'amount' => ['money!', 'Amount'],
                'note' => ['text', 'Note'],
            ],
        ],
        'account_transfers' => [
            'label' => 'Account transfer',
            'describe' => fn ($r) => "₹{$r['amount']} moved",
            'fields' => [
                'date' => ['date!', 'Date'],
                'from_account_id' => ['fk:accounts!', 'From account'],
                'to_account_id' => ['fk:accounts!', 'To account'],
                'amount' => ['money!', 'Amount'],
                'note' => ['text', 'Note'],
            ],
        ],
        'stock_adjustments' => [
            'label' => 'Stock adjustment',
            'describe' => fn ($r) => "{$r['mode']} {$r['quantity']} pcs ({$r['reason']})",
            'fields' => [
                'date' => ['date!', 'Date'],
                'design_id' => ['fk:designs!', 'Design'],
                'location_id' => ['fk:locations!', 'Location'],
                'mode' => ['enum:add|remove|set!', 'Type'],
                'quantity' => ['int!', 'Quantity'],
                'reason' => ['str!', 'Reason'],
                'note' => ['text', 'Note'],
            ],
        ],
        'stock_transfers' => [
            'label' => 'Stock transfer',
            'describe' => fn ($r) => "{$r['quantity']} pcs moved",
            'fields' => [
                'date' => ['date!', 'Date'],
                'design_id' => ['fk:designs!', 'Design'],
                'from_location_id' => ['fk:locations!', 'From location'],
                'to_location_id' => ['fk:locations!', 'To location'],
                'quantity' => ['int!', 'Quantity'],
                'note' => ['text', 'Note'],
            ],
        ],
    ];
    return $e;
}

function entity(string $name): array
{
    $e = entities()[$name] ?? null;
    if (!$e) {
        throw new HttpError(404, 'Not found.');
    }
    return $e;
}

// Which columns reference each master list (used to archive instead of delete).
function master_references(): array
{
    return [
        'designs' => [['sales', 'design_id'], ['samples', 'design_id'], ['amazon_orders', 'design_id'], ['stock_adjustments', 'design_id'], ['stock_transfers', 'design_id']],
        'locations' => [['sales', 'location_id'], ['samples', 'location_id'], ['amazon_orders', 'location_id'], ['stock_adjustments', 'location_id'], ['stock_transfers', 'from_location_id'], ['stock_transfers', 'to_location_id']],
        'accounts' => [['sale_payments', 'account_id'], ['expenses', 'account_id'], ['amazon_settlements', 'account_id'], ['account_entries', 'account_id'], ['account_transfers', 'from_account_id'], ['account_transfers', 'to_account_id']],
        'categories' => [['expenses', 'category_id']],
        'people' => [['sales', 'person_id'], ['samples', 'person_id'], ['expenses', 'person_id']],
    ];
}

// ---------------------------------------------------------------- casting

function field_kind(string $type): string
{
    $t = rtrim($type, '!');
    return str_contains($t, ':') ? explode(':', $t, 2)[0] : $t;
}

/** Cast DB strings to proper JSON types for one row. */
function cast_row(string $table, array $row): array
{
    $fields = entity($table)['fields'];
    foreach ($row as $k => $v) {
        if ($v === null) {
            continue;
        }
        if ($k === 'id' || $k === 'created_by' || $k === 'updated_by' || $k === 'archived' || $k === 'sale_id') {
            $row[$k] = (int) $v;
            continue;
        }
        if (!isset($fields[$k])) {
            continue;
        }
        $kind = field_kind($fields[$k][0]);
        if ($kind === 'int' || $kind === 'fk') {
            $row[$k] = (int) $v;
        } elseif ($kind === 'money') {
            $row[$k] = round((float) $v, 2);
        }
    }
    if (isset($row['archived'])) {
        $row['archived'] = (bool) $row['archived'];
    }
    return $row;
}

// ---------------------------------------------------------------- validation

/** Turn a request payload into clean column values, or throw a friendly 422. */
function clean_payload(string $table, array $in): array
{
    $fields = entity($table)['fields'];
    $out = [];
    $missing = [];
    $problems = [];

    foreach ($fields as $col => [$type, $label]) {
        $required = str_ends_with($type, '!');
        $t = rtrim($type, '!');
        $kind = field_kind($t);
        $v = $in[$col] ?? null;
        if (is_string($v)) {
            $v = trim($v);
        }
        $empty = $v === null || $v === '';

        if ($empty) {
            if ($required) {
                $missing[] = $label;
            }
            $out[$col] = in_array($kind, ['int', 'money'], true) && !in_array($col, ['low_stock'], true) ? 0 : null;
            continue;
        }

        switch ($kind) {
            case 'date':
                $d = DateTimeImmutable::createFromFormat('!Y-m-d', (string) $v);
                if (!$d || $d->format('Y-m-d') !== $v) {
                    $problems[] = "$label is not a valid date.";
                }
                $out[$col] = $v;
                break;
            case 'int':
                if (!is_numeric($v) || (float) $v != (int) $v) {
                    $problems[] = "$label must be a whole number.";
                } elseif ((int) $v < 0) {
                    $problems[] = "$label cannot be negative.";
                }
                $out[$col] = (int) $v;
                break;
            case 'money':
                if (!is_numeric($v)) {
                    $problems[] = "$label must be a number.";
                } elseif ((float) $v < 0) {
                    $problems[] = "$label cannot be negative.";
                }
                $out[$col] = round((float) $v, 2);
                break;
            case 'fk':
                $ref = explode(':', $t, 2)[1];
                if (!ctype_digit((string) $v) || !scalar("SELECT id FROM $ref WHERE id = ?", [(int) $v])) {
                    $problems[] = "Please choose a valid $label.";
                }
                $out[$col] = (int) $v;
                break;
            case 'enum':
                $allowed = explode('|', explode(':', $t, 2)[1]);
                if (!in_array($v, $allowed, true)) {
                    $problems[] = "Please choose a valid $label.";
                }
                $out[$col] = $v;
                break;
            case 'str':
                $out[$col] = mb_substr((string) $v, 0, 190);
                break;
            default:
                $out[$col] = (string) $v;
        }
    }

    if ($missing) {
        array_unshift($problems, 'Please fill in: ' . implode(', ', $missing) . '.');
    }
    if ($problems) {
        throw new HttpError(422, implode(' ', $problems), 'validation');
    }
    return $out;
}

// ---------------------------------------------------------------- CRUD

function list_rows(string $table): array
{
    entity($table);
    $order = in_array($table, MASTER_TABLES, true) ? 'archived, sort, name' : 'date DESC, id DESC';
    return array_map(fn ($r) => cast_row($table, $r), rows("SELECT * FROM $table ORDER BY $order"));
}

function get_row(string $table, int $id): array
{
    $row = one("SELECT * FROM $table WHERE id = ?", [$id]);
    if (!$row) {
        throw new HttpError(404, 'This record no longer exists. Someone may have deleted it.', 'gone');
    }
    return cast_row($table, $row);
}

function describe(string $table, array $row): string
{
    $e = entity($table);
    if (!empty($e['master'])) {
        return "{$e['label']} “{$row['name']}”";
    }
    return $e['label'] . ' · ' . ($e['describe'])($row);
}

function create_row(string $table, array $data): array
{
    $ts = now();
    $data += ['created_at' => $ts, 'created_by' => uid(), 'updated_at' => $ts, 'updated_by' => uid()];
    $cols = array_keys($data);
    q(
        "INSERT INTO $table (" . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')',
        array_values($data)
    );
    $row = get_row($table, (int) db()->lastInsertId());
    log_activity('added', $table, $row['id'], describe($table, $row), $row);
    return $row;
}

/**
 * Update a row. If the client sends the updated_at it last saw and the row has
 * since been changed by someone else, refuse rather than silently overwrite.
 */
function update_row(string $table, int $id, array $data, ?string $seenUpdatedAt): array
{
    $before = get_row($table, $id);
    if ($seenUpdatedAt && $seenUpdatedAt !== $before['updated_at']) {
        throw new HttpError(409, 'Someone else changed this record while you were editing. Please close the form and try again.', 'conflict');
    }
    $data += ['updated_at' => now(), 'updated_by' => uid()];
    $sets = implode(',', array_map(fn ($c) => "$c = ?", array_keys($data)));
    q("UPDATE $table SET $sets WHERE id = ?", [...array_values($data), $id]);
    $after = get_row($table, $id);
    log_activity('edited', $table, $id, describe($table, $after), ['before' => $before, 'after' => $after]);
    return $after;
}

function delete_row(string $table, int $id): array
{
    $row = get_row($table, $id);

    if (in_array($table, MASTER_TABLES, true)) {
        foreach (master_references()[$table] as [$refTable, $col]) {
            if (scalar("SELECT 1 FROM $refTable WHERE $col = ? LIMIT 1", [$id])) {
                q("UPDATE $table SET archived = 1, updated_at = ?, updated_by = ? WHERE id = ?", [now(), uid(), $id]);
                log_activity('archived', $table, $id, describe($table, $row), $row);
                return ['archived' => true];
            }
        }
    }

    if ($table === 'sales') {
        $row['payments'] = rows('SELECT * FROM sale_payments WHERE sale_id = ?', [$id]);
        q('UPDATE gst_sales SET sale_id = NULL WHERE sale_id = ?', [$id]);
    }
    q("DELETE FROM $table WHERE id = ?", [$id]);
    log_activity('deleted', $table, $id, describe($table, $row), $row);
    return ['deleted' => true];
}

function restore_master(string $table, int $id): array
{
    if (!in_array($table, MASTER_TABLES, true)) {
        throw new HttpError(404, 'Not found.');
    }
    q("UPDATE $table SET archived = 0, updated_at = ?, updated_by = ? WHERE id = ?", [now(), uid(), $id]);
    $row = get_row($table, $id);
    log_activity('restored', $table, $id, describe($table, $row));
    return $row;
}
