<?php
// Full JSON backup of the business data, and restore from one.
// Login accounts are deliberately left out so a restore can't lock anyone out.

declare(strict_types=1);

// Parents before children so a restore can insert in this order.
const BACKUP_TABLES = [
    'settings', 'designs', 'locations', 'accounts', 'categories', 'people',
    'sales', 'sale_payments', 'samples', 'expenses', 'amazon_orders', 'amazon_settlements',
    'gst_purchases', 'gst_sales', 'account_entries', 'account_transfers',
    'stock_adjustments', 'stock_transfers',
    'cms_revisions', 'cms_draft', 'cms_media',
];

// Added after the first backups were made: a backup without them leaves them as they are.
const BACKUP_OPTIONAL = ['cms_revisions', 'cms_draft', 'cms_media'];

// Internal settings that belong to this server, not to the business data.
const SETTINGS_KEPT = ['schema_version', 'analytics_salt'];

function make_backup(): array
{
    $data = [];
    foreach (BACKUP_TABLES as $t) {
        $data[$t] = rows("SELECT * FROM $t ORDER BY 1");
    }
    $data['settings'] = array_values(array_filter($data['settings'], fn ($r) => !in_array($r['k'], SETTINGS_KEPT, true)));
    log_activity('exported', 'backup', null, 'Downloaded a full backup');
    return ['app' => 'thanda-kapda-dashboard', 'version' => 2, 'created_at' => now(), 'tables' => $data];
}

function restore_backup(array $backup): array
{
    if (($backup['app'] ?? '') !== 'thanda-kapda-dashboard' || !is_array($backup['tables'] ?? null)) {
        throw new HttpError(422, 'This file is not a Thanda Kapda backup.', 'validation');
    }
    $tables = $backup['tables'];
    foreach (BACKUP_TABLES as $t) {
        if ((!isset($tables[$t]) || !is_array($tables[$t])) && !in_array($t, BACKUP_OPTIONAL, true)) {
            throw new HttpError(422, "The backup is incomplete (missing $t).", 'validation');
        }
    }
    $present = array_values(array_filter(BACKUP_TABLES, fn ($t) => is_array($tables[$t] ?? null)));
    $kept = SETTINGS_KEPT;
    $tables['settings'] = array_values(array_filter($tables['settings'], fn ($r) => !in_array($r['k'] ?? '', $kept, true)));

    $counts = [];
    db()->beginTransaction();
    try {
        foreach (array_reverse($present) as $t) {
            if ($t === 'settings') {
                q('DELETE FROM settings WHERE k NOT IN (' . implode(',', array_fill(0, count($kept), '?')) . ')', $kept);
            } else {
                db()->exec("DELETE FROM $t");
            }
        }
        foreach ($present as $t) {
            $columns = array_column(rows("SHOW COLUMNS FROM $t"), 'Field');
            foreach ($tables[$t] as $row) {
                $row = array_intersect_key($row, array_flip($columns));
                if (!$row) {
                    continue;
                }
                $cols = array_keys($row);
                q("INSERT INTO $t (" . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')', array_values($row));
            }
            $counts[$t] = count($tables[$t]);
        }
        log_activity('restored', 'backup', null, 'Restored data from a backup made ' . ($backup['created_at'] ?? 'earlier'));
        db()->commit();
        q('INSERT IGNORE INTO cms_draft (id) VALUES (1)');
        if (in_array('cms_revisions', $present, true)) {
            // The website follows whatever is now the latest published version.
            write_live_content(one('SELECT * FROM cms_revisions ORDER BY id DESC LIMIT 1'));
        }
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
    return ['restored' => $counts];
}
