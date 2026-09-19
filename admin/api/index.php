<?php
// Single entry point for the dashboard API. Apache rewrites /api/<path> here
// as ?r=<path>; the local dev router does the same.

declare(strict_types=1);

require __DIR__ . '/src/core.php';
require __DIR__ . '/src/entities.php';
require __DIR__ . '/src/sales.php';
require __DIR__ . '/src/reports.php';
require __DIR__ . '/src/backup.php';

error_reporting(E_ALL);
ini_set('display_errors', '0');
date_default_timezone_set('Asia/Kolkata');

$method = $_SERVER['REQUEST_METHOD'];
$path = trim((string) ($_GET['r'] ?? ''), '/');
$parts = $path === '' ? [] : explode('/', $path);

try {
    // Writes must come from our own front end (blocks cross-site form posts).
    if ($method !== 'GET' && ($_SERVER['HTTP_X_TK_CLIENT'] ?? '') !== '1') {
        throw new HttpError(403, 'Request blocked.');
    }

    ensure_installed();
    send(route($method, $parts));
} catch (HttpError $e) {
    send(['error' => $e->getMessage(), 'code' => $e->errCode] + $e->extra, $e->status);
} catch (Throwable $e) {
    error_log('[tk-admin] ' . $e);
    $msg = !empty(config()['debug']) ? $e->getMessage() : 'Something went wrong on the server. Please try again.';
    send(['error' => $msg, 'code' => 'server'], 500);
}

function route(string $method, array $p): mixed
{
    $a = $p[0] ?? '';
    $id = isset($p[1]) && ctype_digit($p[1]) ? (int) $p[1] : null;

    // ---------- auth (no login needed)
    if ($a === 'auth') {
        return route_auth($method, $p[1] ?? '');
    }

    $user = require_user();

    switch (true) {
        case $a === 'version' && $method === 'GET':
            return ['version' => data_version()];

        case $a === 'bootstrap' && $method === 'GET':
            $masters = [];
            foreach (MASTER_TABLES as $t) {
                $masters[$t] = list_rows($t);
            }
            return ['user' => $user, 'masters' => $masters, 'version' => data_version(), 'today' => today(),
                    'user_names' => array_column(rows('SELECT id, name FROM users'), 'name', 'id')];

        // ---------- reports
        case $a === 'reports':
            return route_reports($p[1] ?? '');

        case $a === 'activity' && $method === 'GET':
            $limit = min(500, max(1, (int) ($_GET['limit'] ?? 200)));
            return array_map(fn ($r) => ['id' => (int) $r['id'], 'at' => $r['at'], 'user' => $r['name'], 'action' => $r['action'], 'entity' => $r['entity'], 'entity_id' => $r['entity_id'] === null ? null : (int) $r['entity_id'], 'summary' => $r['summary']],
                rows("SELECT a.*, u.name FROM activity_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT $limit"));

        case $a === 'backup' && $method === 'GET':
            return make_backup();

        case $a === 'restore' && $method === 'POST':
            require_owner();
            return restore_backup(input());

        case $a === 'users':
            return route_users($method, $id);

        case $a === 'me' && $method === 'PUT':
            $theme = input()['theme'] ?? 'system';
            if (in_array($theme, ['light', 'dark', 'system'], true)) {
                q('UPDATE users SET theme = ? WHERE id = ?', [$theme, $user['id']]);
            }
            return ['ok' => true];

        // ---------- sales (with payments)
        case $a === 'sales':
            if ($method === 'GET') {
                return $id ? get_sale($id) : list_sales();
            }
            if ($method === 'POST' && !$id) {
                return save_sale(null);
            }
            if ($method === 'PUT' && $id) {
                return save_sale($id);
            }
            if ($method === 'DELETE' && $id) {
                return delete_row('sales', $id);
            }
            break;

        // ---------- bulk Amazon import
        case $a === 'amazon_orders' && ($p[1] ?? '') === 'import' && $method === 'POST':
            return import_amazon(input()['rows'] ?? []);

        // ---------- everything else is generic CRUD
        case isset(entities()[$a]):
            if ($method === 'GET') {
                return $id ? get_row($a, $id) : list_rows($a);
            }
            if ($method === 'POST' && $id && ($p[2] ?? '') === 'restore') {
                return restore_master($a, $id);
            }
            if ($method === 'POST' && !$id) {
                $data = clean_payload($a, input());
                check_rules($a, $data, null);
                return create_row($a, $data);
            }
            if ($method === 'PUT' && $id) {
                $data = clean_payload($a, input());
                check_rules($a, $data, $id);
                return update_row($a, $id, $data, input()['updated_at'] ?? null);
            }
            if ($method === 'DELETE' && $id) {
                return delete_row($a, $id);
            }
            break;
    }
    throw new HttpError(404, 'Not found.');
}

/** Record-specific rules on top of the generic field validation. */
function check_rules(string $table, array $d, ?int $id): void
{
    if ($table === 'stock_transfers') {
        if ($d['from_location_id'] === $d['to_location_id']) {
            throw new HttpError(422, 'The "from" and "to" locations must be different.', 'validation');
        }
        if ($d['quantity'] <= 0) {
            throw new HttpError(422, 'Quantity to move must be more than 0.', 'validation');
        }
    }
    if ($table === 'account_transfers' && $d['from_account_id'] === $d['to_account_id']) {
        throw new HttpError(422, 'The "from" and "to" accounts must be different.', 'validation');
    }
    if (in_array($table, ['samples'], true) && $d['quantity'] <= 0) {
        throw new HttpError(422, 'Quantity must be more than 0.', 'validation');
    }
    if (in_array($table, ['expenses', 'account_transfers', 'account_entries'], true) && $d['amount'] <= 0) {
        throw new HttpError(422, 'Amount must be more than 0.', 'validation');
    }
    if ($table === 'amazon_orders' && empty(input()['confirm_duplicate'])) {
        $dup = scalar('SELECT id FROM amazon_orders WHERE order_id = ? AND id <> ?', [$d['order_id'], $id ?? 0]);
        if ($dup) {
            throw new HttpError(422, "Order ID {$d['order_id']} is already in the list. Save it again anyway?", 'duplicate');
        }
    }
    if (in_array($table, MASTER_TABLES, true)) {
        $dup = scalar("SELECT id FROM $table WHERE LOWER(name) = LOWER(?) AND id <> ?", [$d['name'], $id ?? 0]);
        if ($dup) {
            throw new HttpError(422, "“{$d['name']}” is already in this list.", 'validation');
        }
    }
}

function route_auth(string $method, string $action): mixed
{
    switch ($action) {
        case 'status':
            return ['needs_setup' => (int) scalar('SELECT COUNT(*) FROM users') === 0, 'user' => current_user()];

        case 'setup':
            if ($method !== 'POST' || (int) scalar('SELECT COUNT(*) FROM users') > 0) {
                throw new HttpError(403, 'Setup has already been done.');
            }
            // Optional one-time code from config.php, so only the owner can claim the first login.
            $key = (string) (config()['setup_key'] ?? '');
            if ($key !== '' && !hash_equals($key, trim((string) (input()['setup_key'] ?? '')))) {
                throw new HttpError(403, 'That setup code is not right.', 'validation');
            }
            $id = create_user(input(), 'owner');
            start_session($id);
            log_activity('added', 'users', $id, 'Created the first owner account');
            return ['user' => current_user_fresh($id)];

        case 'login':
            if ($method !== 'POST') {
                break;
            }
            throttle_login();
            $in = input();
            $u = one('SELECT * FROM users WHERE email = ? AND active = 1', [mb_strtolower(trim((string) ($in['email'] ?? '')))]);
            if (!$u || !password_verify((string) ($in['password'] ?? ''), $u['password_hash'])) {
                q('INSERT INTO login_attempts (ip) VALUES (?)', [client_ip()]);
                throw new HttpError(401, 'That email and password don’t match.', 'login');
            }
            q('DELETE FROM login_attempts WHERE ip = ?', [client_ip()]);
            start_session((int) $u['id']);
            return ['user' => current_user_fresh((int) $u['id'])];

        case 'logout':
            end_session();
            return ['ok' => true];
    }
    throw new HttpError(404, 'Not found.');
}

function current_user_fresh(int $id): array
{
    $u = one('SELECT id, name, email, role, theme FROM users WHERE id = ?', [$id]);
    $u['id'] = (int) $u['id'];
    return $u;
}

function create_user(array $in, string $role): int
{
    $name = trim((string) ($in['name'] ?? ''));
    $email = mb_strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new HttpError(422, 'Please enter a name and a valid email.', 'validation');
    }
    if (strlen($password) < 8) {
        throw new HttpError(422, 'The password must be at least 8 characters.', 'validation');
    }
    if (scalar('SELECT id FROM users WHERE email = ?', [$email])) {
        throw new HttpError(422, 'Someone with that email already has an account.', 'validation');
    }
    q('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [$name, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
    return (int) db()->lastInsertId();
}

function route_users(string $method, ?int $id): mixed
{
    if ($method === 'GET') {
        return array_map(fn ($u) => ['id' => (int) $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'], 'active' => (bool) $u['active']],
            rows('SELECT id, name, email, role, active FROM users ORDER BY id'));
    }
    $me = require_owner();
    $in = input();
    if ($method === 'POST' && !$id) {
        $newId = create_user($in, in_array($in['role'] ?? '', ['owner', 'staff'], true) ? $in['role'] : 'owner');
        log_activity('added', 'users', $newId, "Added login for {$in['name']}");
        return ['id' => $newId];
    }
    if ($method === 'PUT' && $id) {
        $u = one('SELECT * FROM users WHERE id = ?', [$id]) ?? throw new HttpError(404, 'Not found.');
        $active = array_key_exists('active', $in) ? (int) (bool) $in['active'] : (int) $u['active'];
        if ($id === $me['id'] && !$active) {
            throw new HttpError(422, 'You can’t switch off your own login.', 'validation');
        }
        q('UPDATE users SET name = ?, active = ?, updated_at = NOW() WHERE id = ?', [trim((string) ($in['name'] ?? $u['name'])) ?: $u['name'], $active, $id]);
        if (!empty($in['password'])) {
            if (strlen((string) $in['password']) < 8) {
                throw new HttpError(422, 'The password must be at least 8 characters.', 'validation');
            }
            q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash((string) $in['password'], PASSWORD_DEFAULT), $id]);
            q('DELETE FROM sessions WHERE user_id = ? AND user_id <> ?', [$id, $me['id']]);
        }
        if (!$active) {
            q('DELETE FROM sessions WHERE user_id = ?', [$id]);
        }
        log_activity('edited', 'users', $id, "Updated login for {$u['name']}");
        return ['ok' => true];
    }
    throw new HttpError(404, 'Not found.');
}

function route_reports(string $name): mixed
{
    $int = fn (string $k) => isset($_GET[$k]) && ctype_digit((string) $_GET[$k]) ? (int) $_GET[$k] : throw new HttpError(422, "Missing $k.");
    $date = fn (string $k) => isset($_GET[$k]) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $_GET[$k]) ? (string) $_GET[$k] : null;
    return match ($name) {
        'stock' => stock_grid(),
        'stock-history' => stock_history($int('design_id'), $int('location_id')),
        'balances' => balances(),
        'statement' => statement($int('account_id')),
        'ageing' => ageing(),
        'dashboard' => dashboard($date('from'), $date('to')),
        'gst' => gst_summary(),
        default => throw new HttpError(404, 'Not found.'),
    };
}

/** Insert many Amazon orders at once (from a CSV the browser has already parsed). */
function import_amazon(array $rows): array
{
    if (!$rows || count($rows) > 5000) {
        throw new HttpError(422, 'No orders to import.', 'validation');
    }
    $added = 0;
    $skipped = [];
    db()->beginTransaction();
    try {
        foreach ($rows as $i => $r) {
            try {
                $d = clean_payload('amazon_orders', (array) $r);
            } catch (HttpError $e) {
                $skipped[] = 'Row ' . ($i + 2) . ': ' . $e->getMessage();
                continue;
            }
            if (scalar("SELECT id FROM amazon_orders WHERE order_id = ? AND COALESCE(invoice_no, '') = ?", [$d['order_id'], (string) $d['invoice_no']])) {
                $skipped[] = "Order {$d['order_id']} is already in the list.";
                continue;
            }
            $ts = now();
            $d += ['created_at' => $ts, 'created_by' => uid(), 'updated_at' => $ts, 'updated_by' => uid()];
            $cols = array_keys($d);
            q('INSERT INTO amazon_orders (' . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')', array_values($d));
            $added++;
        }
        log_activity('imported', 'amazon_orders', null, "Imported $added Amazon orders from a file");
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
    return ['added' => $added, 'skipped' => $skipped];
}
