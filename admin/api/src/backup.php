<?php
// Full backup of the dashboard and the website it runs, and restore from one.
//
// A backup is a .zip that the browser builds: manifest.json, one JSON file per
// table and every photo file under live/media. The browser does the zipping
// because shared hosting often lacks PHP's zip extension and caps how much one
// request may carry, so data is read from here page by page and a restore is
// sent back in small pieces. Nothing changes until the last step (finish),
// which checks every piece and then replaces everything in one transaction:
// either the whole backup is restored or nothing changes.

declare(strict_types=1);

const BACKUP_APP = 'thanda-kapda-dashboard';
/** 1 and 2 were single JSON files of the business tables; the browser turns them into a partial restore. */
const BACKUP_FORMAT = 3;

/**
 * Every table that holds business or website data. A new table must be added
 * here or to BACKUP_SKIPPED_TABLES; tests/backup.test.ts fails until it is.
 */
const BACKUP_TABLES = [
    'users', 'settings',
    'designs', 'locations', 'accounts', 'categories', 'people',
    'sales', 'sale_payments', 'samples', 'expenses', 'amazon_orders', 'amazon_settlements',
    'gst_purchases', 'gst_sales', 'account_entries', 'account_transfers',
    'stock_adjustments', 'stock_transfers', 'todos',
    'cms_revisions', 'cms_draft', 'cms_media',
    'activity_log', 'analytics_views', 'analytics_events',
];
/** Belong to this server: who is signed in right now, and restores in progress. */
const BACKUP_SKIPPED_TABLES = ['sessions', 'login_attempts', 'restore_parts'];
/** Settings that belong to this server, not to the business. */
const SETTINGS_KEPT = ['schema_version', 'analytics_salt'];

const BACKUP_PAGE_ROWS = 2000;
const RESTORE_MAX_PIECE = 4 * 1024 * 1024;
const RESTORE_MAX_FILE = 64 * 1024 * 1024;
/** One INSERT carries at most this much, well under MySQL's smallest usual max_allowed_packet. */
const RESTORE_INSERT_BYTES = 2 * 1024 * 1024;

// ---------------------------------------------------------------- routes

function route_backup(string $method, array $p): mixed
{
    require_owner(); // a backup holds every login, so only owners may take one
    $a = $p[1] ?? '';
    if ($method === 'GET' && $a === 'manifest') {
        return backup_manifest();
    }
    if ($method === 'GET' && $a === 'rows') {
        return backup_rows((string) ($_GET['table'] ?? ''), $_GET['after'] ?? null, $_GET['upto'] ?? null);
    }
    if ($method === 'GET' && $a === 'file') {
        backup_file((string) ($_GET['path'] ?? ''));
    }
    if ($method === 'POST' && $a === 'done') {
        $in = input();
        log_activity('exported', 'backup', null, sprintf('Downloaded a full backup (%d records, %d photo files)', (int) ($in['records'] ?? 0), (int) ($in['files'] ?? 0)));
        return ['ok' => true];
    }
    throw new HttpError(404, 'Not found.');
}

function route_restore(string $method, array $p): mixed
{
    require_owner();
    $a = $p[1] ?? '';
    if ($method === 'POST' && $a === 'start') {
        return restore_start(input()['manifest'] ?? null);
    }
    $token = (string) ($_GET['token'] ?? '');
    if ($method === 'POST' && $a === 'rows') {
        return restore_rows($token, (string) ($_GET['table'] ?? ''), (int) ($_GET['seq'] ?? -1), input()['rows'] ?? null);
    }
    if ($method === 'POST' && $a === 'file') {
        return restore_file($token, (string) ($_GET['path'] ?? ''), (int) ($_GET['offset'] ?? -1));
    }
    if ($method === 'POST' && $a === 'finish') {
        return restore_finish($token);
    }
    if ($method === 'POST' && $a === 'cancel') {
        restore_cleanup($token);
        return ['ok' => true];
    }
    throw new HttpError(404, 'Not found.');
}

// ---------------------------------------------------------------- helpers

function table_columns(string $t): array
{
    return array_column(rows("SHOW COLUMNS FROM `$t`"), 'Field');
}

function table_key(string $t): string
{
    $keys = rows("SHOW KEYS FROM `$t` WHERE Key_name = 'PRIMARY'");
    if (count($keys) !== 1) {
        throw new RuntimeException("Table $t needs a single-column primary key to be backed up.");
    }
    return $keys[0]['Column_name'];
}

/** A photo path inside live/media, or null if it could point anywhere else or isn't a photo. */
function media_rel_ok(string $rel): bool
{
    return strlen($rel) <= 250
        && preg_match('#^[A-Za-z0-9_-][A-Za-z0-9_.-]*(/[A-Za-z0-9_-][A-Za-z0-9_.-]*)*\.(jpe?g|png|webp)$#i', $rel) === 1
        && !str_contains($rel, '..');
}

/** Every photo file the website can show, with its size and fingerprint. */
function media_files(): array
{
    $root = live_dir() . '/media';
    $files = [];
    $skipped = [];
    if (is_dir($root)) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) {
            if (!$f->isFile()) {
                continue;
            }
            $rel = str_replace('\\', '/', substr($f->getPathname(), strlen($root) + 1));
            if (!media_rel_ok($rel)) {
                $skipped[] = $rel;
                continue;
            }
            $files[] = ['path' => $rel, 'bytes' => $f->getSize(), 'sha256' => hash_file('sha256', $f->getPathname())];
        }
    }
    usort($files, fn ($a, $b) => strcmp($a['path'], $b['path']));
    sort($skipped);
    return [$files, $skipped];
}

function rrmdir(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($it as $f) {
        $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
    }
    @rmdir($dir);
}

// ---------------------------------------------------------------- backup

function backup_manifest(): array
{
    $tables = [];
    foreach (BACKUP_TABLES as $t) {
        $key = table_key($t);
        $tables[$t] = [
            'columns' => table_columns($t),
            'key' => $key,
            // Rows added while the browser is downloading (visits keep coming) wait for the next backup.
            'upto' => $key === 'id' ? (int) (scalar("SELECT MAX(id) FROM `$t`") ?? 0) : null,
        ];
    }
    [$files, $skipped] = media_files();
    return [
        'app' => BACKUP_APP,
        'format' => BACKUP_FORMAT,
        'schema' => SCHEMA_VERSION,
        'created_at' => now(),
        'version' => data_version(),
        'public_base' => public_base(),
        'business' => scalar("SELECT v FROM settings WHERE k = 'business_name'"),
        'tables' => $tables,
        'files' => $files,
        'skipped_files' => $skipped,
    ];
}

/** One page of a table, in key order. Values come back exactly as stored. */
function backup_rows(string $t, mixed $after, mixed $upto): array
{
    if (!in_array($t, BACKUP_TABLES, true)) {
        throw new HttpError(404, 'Not found.');
    }
    $key = table_key($t);
    $where = [];
    $params = [];
    if ($after !== null && $after !== '') {
        $where[] = "`$key` > ?";
        $params[] = $key === 'id' ? (int) $after : (string) $after;
    }
    if ($key === 'id' && $upto !== null && $upto !== '') {
        $where[] = '`id` <= ?';
        $params[] = (int) $upto;
    }
    if ($t === 'settings') {
        $where[] = 'k NOT IN (' . implode(',', array_fill(0, count(SETTINGS_KEPT), '?')) . ')';
        array_push($params, ...SETTINGS_KEPT);
    }
    $rows = rows("SELECT * FROM `$t`" . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . " ORDER BY `$key` LIMIT " . BACKUP_PAGE_ROWS, $params);
    $more = count($rows) === BACKUP_PAGE_ROWS;
    return ['rows' => $rows, 'next' => $more ? end($rows)[$key] : null];
}

function backup_file(string $rel): never
{
    $file = live_dir() . '/media/' . $rel;
    if (!media_rel_ok($rel) || !is_file($file)) {
        throw new HttpError(404, 'That photo file is missing on the server.', 'gone');
    }
    http_response_code(200);
    header('Content-Type: application/octet-stream');
    header('Cache-Control: no-store');
    header('Content-Length: ' . filesize($file));
    readfile($file);
    exit;
}

// ---------------------------------------------------------------- restore

function restore_dir(string $token): string
{
    return live_dir() . "/.restore-$token";
}

/** Checks a backup's manifest against this dashboard before anything is uploaded. */
function check_manifest(mixed $m): array
{
    $bad = fn (string $why) => new HttpError(422, $why, 'validation');
    if (!is_array($m) || ($m['app'] ?? null) !== BACKUP_APP) {
        throw $bad('This file is not a Thanda Kapda backup.');
    }
    if (!is_int($m['format'] ?? null) || !is_int($m['schema'] ?? null)) {
        throw $bad('This backup is damaged (its contents list can’t be read).');
    }
    if ($m['format'] > BACKUP_FORMAT || $m['schema'] > SCHEMA_VERSION) {
        throw $bad('This backup was made by a newer version of the dashboard. Update the dashboard on this server first, then restore.');
    }
    $partial = !empty($m['partial']);
    $tables = $m['tables'] ?? null;
    if (!is_array($tables) || !$tables || array_is_list($tables)) {
        throw $bad('This backup has no records in it.');
    }
    $out = [];
    foreach ($tables as $t => $info) {
        if (!in_array($t, BACKUP_TABLES, true)) {
            throw $bad("This backup contains “{$t}”, which this dashboard doesn’t know. Update the dashboard first.");
        }
        $cols = $info['columns'] ?? null;
        $count = $info['count'] ?? null;
        if (!is_array($cols) || !array_is_list($cols) || !is_int($count) || $count < 0) {
            throw $bad("This backup is damaged (the list for “{$t}” can’t be read).");
        }
        $unknown = array_diff($cols, table_columns($t));
        if ($unknown) {
            // Restoring would silently drop these values, so refuse instead.
            throw $bad("This backup has information this dashboard doesn’t store ({$t}: " . implode(', ', $unknown) . '). Update the dashboard first.');
        }
        $out[$t] = ['columns' => array_values($cols), 'count' => $count];
    }
    if (!$partial && $m['schema'] === SCHEMA_VERSION && ($missing = array_diff(BACKUP_TABLES, array_keys($out)))) {
        throw $bad('This backup is incomplete (missing ' . implode(', ', $missing) . ').');
    }
    $files = $m['files'] ?? [];
    if (!is_array($files) || !array_is_list($files) || ($partial && $files)) {
        throw $bad('This backup is damaged (its photo list can’t be read).');
    }
    $seen = [];
    foreach ($files as $f) {
        $path = $f['path'] ?? null;
        if (!is_string($path) || !media_rel_ok($path) || isset($seen[strtolower($path)])
            || !is_int($f['bytes'] ?? null) || $f['bytes'] < 0 || $f['bytes'] > RESTORE_MAX_FILE
            || !is_string($f['sha256'] ?? null) || !preg_match('/^[0-9a-f]{64}$/', $f['sha256'])) {
            throw $bad('This backup is damaged (a photo entry can’t be read: ' . (is_string($path) ? $path : '?') . ').');
        }
        $seen[strtolower($path)] = true;
    }
    $base = $m['public_base'] ?? null;
    return [
        'partial' => $partial,
        'schema' => $m['schema'],
        'created_at' => is_string($m['created_at'] ?? null) ? mb_substr($m['created_at'], 0, 40) : null,
        'public_base' => is_string($base) && preg_match('#^https?://[^\s"\\\\]+$#', $base) ? rtrim($base, '/') : null,
        'tables' => $out,
        'files' => array_map(fn ($f) => ['path' => $f['path'], 'bytes' => $f['bytes'], 'sha256' => $f['sha256']], $files),
    ];
}

/** Removes restores that were started but never finished (closed tab, lost connection). */
function restore_sweep(): void
{
    foreach (rows("SELECT DISTINCT token FROM restore_parts WHERE created_at < NOW() - INTERVAL 1 DAY") as $r) {
        restore_cleanup($r['token']);
    }
    foreach (array_merge(glob(live_dir() . '/.restore-*', GLOB_ONLYDIR) ?: [], glob(live_dir() . '/.media-old-*', GLOB_ONLYDIR) ?: []) as $dir) {
        if (filemtime($dir) < time() - 86400) {
            rrmdir($dir);
        }
    }
}

function restore_cleanup(string $token): void
{
    if (!preg_match('/^[0-9a-f]{32}$/', $token)) {
        return;
    }
    q('DELETE FROM restore_parts WHERE token = ?', [$token]);
    rrmdir(restore_dir($token));
}

function restore_start(mixed $manifest): array
{
    $m = check_manifest($manifest);
    restore_sweep();
    if ($m['files'] && !ensure_storage()) {
        throw new HttpError(500, 'The dashboard can’t write to its “live” folder on the server, so photos can’t be restored. See Settings → Website storage.', 'storage');
    }
    $token = bin2hex(random_bytes(16));
    if (!$m['partial'] && !@mkdir(restore_dir($token) . '/media', 0755, true)) {
        throw new HttpError(500, 'Could not make room for the photos on the server. See Settings → Website storage.', 'storage');
    }
    q('INSERT INTO restore_parts (token, name, seq, n, data, created_at, created_by) VALUES (?, ?, 0, 0, ?, ?, ?)',
        [$token, '_manifest', json_encode($m, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), now(), uid()]);
    return ['token' => $token];
}

function restore_job(string $token): array
{
    $json = preg_match('/^[0-9a-f]{32}$/', $token) ? scalar("SELECT data FROM restore_parts WHERE token = ? AND name = '_manifest'", [$token]) : null;
    if ($json === null) {
        throw new HttpError(410, 'This restore was interrupted and has expired. Please choose the backup file again.', 'gone');
    }
    return json_decode($json, true);
}

/** One batch of a table's rows. Sending the same batch again replaces it, so retries are safe. */
function restore_rows(string $token, string $table, int $seq, mixed $rows): array
{
    $m = restore_job($token);
    $cols = $m['tables'][$table]['columns'] ?? null;
    if ($cols === null || $seq < 0 || !is_array($rows) || !array_is_list($rows)) {
        throw new HttpError(422, 'Part of the backup arrived damaged. Please try again.', 'validation');
    }
    $allowed = array_flip($cols);
    foreach ($rows as $r) {
        if (!is_array($r) || ($r && array_is_list($r)) || array_diff_key($r, $allowed)) {
            throw new HttpError(422, "A record in “{$table}” doesn’t match the backup’s own description. The file may be damaged.", 'validation');
        }
    }
    q('REPLACE INTO restore_parts (token, name, seq, n, data, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [$token, $table, $seq, count($rows), json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION), now(), uid()]);
    return ['ok' => true];
}

/** A piece of a photo file, written at its offset. Re-sending a piece is safe. */
function restore_file(string $token, string $rel, int $offset): array
{
    $m = restore_job($token);
    $entry = null;
    foreach ($m['files'] as $f) {
        if ($f['path'] === $rel) {
            $entry = $f;
            break;
        }
    }
    $body = file_get_contents('php://input');
    // The browser says how big the piece is (Content-Length is optional over HTTP/2).
    $expected = (int) ($_GET['size'] ?? -1);
    if ($entry === null || $offset < 0 || $body === false || strlen($body) !== $expected || strlen($body) > RESTORE_MAX_PIECE || $offset + strlen($body) > $entry['bytes']) {
        throw new HttpError(422, 'Part of a photo arrived damaged. Please try again.', 'validation');
    }
    $dest = restore_dir($token) . '/media/' . $rel;
    if (!is_dir(dirname($dest)) && !@mkdir(dirname($dest), 0755, true) && !is_dir(dirname($dest))) {
        throw new HttpError(500, 'Could not save a photo on the server. See Settings → Website storage.', 'storage');
    }
    clearstatcache(true, $dest);
    $have = is_file($dest) ? filesize($dest) : 0;
    if ($offset > $have) {
        throw new HttpError(409, 'A piece of a photo went missing on the way. Please try again.', 'validation');
    }
    $fh = @fopen($dest, 'c');
    if (!$fh || !ftruncate($fh, $offset) || fseek($fh, $offset) !== 0 || fwrite($fh, $body) !== strlen($body)) {
        throw new HttpError(500, 'Could not save a photo on the server. Is the server’s disk full?', 'storage');
    }
    fclose($fh);
    return ['received' => $offset + strlen($body)];
}

/** Inserts rows in large batches, each statement kept under RESTORE_INSERT_BYTES. */
function insert_rows(string $table, array $rows): void
{
    $flush = function (array $cols, array $batch) use ($table) {
        if (!$batch) {
            return;
        }
        $one = '(' . implode(',', array_fill(0, count($cols), '?')) . ')';
        $sql = "INSERT INTO `$table` (`" . implode('`,`', $cols) . '`) VALUES ' . implode(',', array_fill(0, count($batch), $one));
        q($sql, array_merge(...$batch));
    };
    $cols = null;
    $batch = [];
    $bytes = 0;
    foreach ($rows as $r) {
        $keys = array_keys($r);
        $size = array_sum(array_map(fn ($v) => is_string($v) ? strlen($v) : 8, $r));
        if ($keys !== $cols || count($batch) >= 500 || ($batch && $bytes + $size > RESTORE_INSERT_BYTES)) {
            $flush($cols ?? [], $batch);
            [$cols, $batch, $bytes] = [$keys, [], 0];
        }
        if (!$keys) {
            continue;
        }
        $batch[] = array_values($r);
        $bytes += $size;
    }
    $flush($cols ?? [], $batch);
}

/** Photo links in the website content point at the server they were uploaded to. */
function move_media_links(string $from, string $to): int
{
    $from .= '/live/media/';
    $to .= '/live/media/';
    $walk = function (mixed $v) use (&$walk, $from, $to): mixed {
        if (is_string($v) && str_starts_with($v, $from)) {
            return $to . substr($v, strlen($from));
        }
        return is_array($v) ? array_map($walk, $v) : $v;
    };
    $changed = 0;
    foreach (['cms_revisions', 'cms_draft'] as $t) {
        foreach (rows("SELECT id, data FROM `$t` WHERE data LIKE ?", ['%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $from) . '%']) as $r) {
            $data = json_decode((string) $r['data'], true);
            if (!is_array($data)) {
                continue;
            }
            q("UPDATE `$t` SET data = ? WHERE id = ?", [json_encode($walk($data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION), $r['id']]);
            $changed++;
        }
    }
    return $changed;
}

/**
 * The person restoring must still be able to get in afterwards, whatever logins
 * the backup has: they keep their password and owner access, and stay signed in.
 */
function keep_restorer_signed_in(array $me, string $sessionHash): array
{
    $notes = [];
    $u = one('SELECT id, role, active FROM users WHERE email = ?', [$me['email']]);
    if ($u) {
        $id = (int) $u['id'];
        if ($u['role'] !== 'owner' || !(int) $u['active']) {
            $notes[] = "Your login ({$me['email']}) was " . (!(int) $u['active'] ? 'switched off' : 'staff') . ' in the backup; it was kept as an owner so you can still get in.';
        }
        q("UPDATE users SET password_hash = ?, role = 'owner', active = 1 WHERE id = ?", [$me['password_hash'], $id]);
        $notes[] = 'You keep the password you use now. Everyone else signs in with the password they had when the backup was made.';
    } else {
        q("INSERT INTO users (name, email, password_hash, role, active, theme, created_at, updated_at) VALUES (?, ?, ?, 'owner', 1, ?, ?, ?)",
            [$me['name'], $me['email'], $me['password_hash'], $me['theme'], now(), now()]);
        $id = (int) db()->lastInsertId();
        $notes[] = "Your login ({$me['email']}) wasn’t in the backup, so it was added as an owner.";
    }
    // Logins may now belong to different people, so everyone else signs in again.
    q('DELETE FROM sessions WHERE token_hash <> ?', [$sessionHash]);
    q('UPDATE sessions SET user_id = ? WHERE token_hash = ?', [$id, $sessionHash]);
    return [$id, $notes];
}

function restore_finish(string $token): array
{
    $m = restore_job($token);
    @set_time_limit(600);
    // Finish even if the browser gives up waiting: stopping halfway is never better.
    ignore_user_abort(true);

    // 1. Everything must have arrived, complete and unchanged.
    $problems = [];
    foreach ($m['tables'] as $t => $info) {
        $got = (int) scalar('SELECT COALESCE(SUM(n), 0) FROM restore_parts WHERE token = ? AND name = ?', [$token, $t]);
        if ($got !== $info['count']) {
            $problems[] = "$t: $got of {$info['count']} records arrived";
        }
    }
    $staged = restore_dir($token) . '/media';
    foreach ($m['files'] as $f) {
        $file = "$staged/{$f['path']}";
        clearstatcache(true, $file);
        if (!is_file($file) || filesize($file) !== $f['bytes'] || hash_file('sha256', $file) !== $f['sha256']) {
            $problems[] = "photo {$f['path']} didn’t arrive intact";
        } elseif ($f['bytes'] > 0 && !@getimagesize($file)) {
            $problems[] = "{$f['path']} is not a photo";
        }
    }
    if ($problems) {
        throw new HttpError(422, 'The backup didn’t arrive complete, so nothing was changed: ' . implode('; ', array_slice($problems, 0, 5)) . (count($problems) > 5 ? ' …' : ''), 'incomplete');
    }

    // 2. Replace everything in one transaction.
    if ((int) scalar("SELECT GET_LOCK('tk_restore', 0)") !== 1) {
        throw new HttpError(409, 'Another restore is running right now. Please wait for it to finish.', 'busy');
    }
    $me = one('SELECT id, name, email, password_hash, theme FROM users WHERE id = ?', [uid()]);
    $session = hash('sha256', (string) ($_COOKIE[SESSION_COOKIE] ?? ''));
    $live = live_dir();
    $oldMedia = "$live/.media-old-$token";
    $swapped = false;
    $notes = [];
    db()->exec('SET FOREIGN_KEY_CHECKS = 0');
    db()->beginTransaction();
    try {
        // A full backup is the whole picture: tables it doesn't mention (from a newer
        // dashboard than the one that made it) are emptied too. A partial one, from
        // an old single-file backup, only replaces the tables it has.
        $replace = $m['partial'] ? array_keys($m['tables']) : BACKUP_TABLES;
        foreach ($replace as $t) {
            if ($t === 'settings') {
                q('DELETE FROM settings WHERE k NOT IN (' . implode(',', array_fill(0, count(SETTINGS_KEPT), '?')) . ')', SETTINGS_KEPT);
            } else {
                db()->exec("DELETE FROM `$t`");
            }
        }
        $counts = [];
        foreach ($m['tables'] as $t => $info) {
            $read = 0;
            // One piece at a time keeps memory low, however big a table is.
            foreach (array_column(rows('SELECT seq FROM restore_parts WHERE token = ? AND name = ? ORDER BY seq', [$token, $t]), 'seq') as $seq) {
                $rows = json_decode((string) scalar('SELECT data FROM restore_parts WHERE token = ? AND name = ? AND seq = ?', [$token, $t, $seq]), true);
                $read += count($rows);
                if ($t === 'settings') {
                    $rows = array_values(array_filter($rows, fn ($r) => !in_array($r['k'] ?? '', SETTINGS_KEPT, true)));
                }
                insert_rows($t, $rows);
            }
            if ($read !== $info['count']) {
                throw new HttpError(422, "The backup didn’t arrive complete ($t), so nothing was changed. Please try again.", 'incomplete');
            }
            $counts[$t] = $info['count'];
        }
        q('INSERT IGNORE INTO cms_draft (id) VALUES (1)');
        if ($m['public_base'] && $m['public_base'] !== public_base() && move_media_links($m['public_base'], public_base())) {
            $notes[] = "Photo links on the website were moved from {$m['public_base']} to " . public_base() . '.';
        }
        $userId = $me ? (int) $me['id'] : null;
        if ($me && isset($m['tables']['users'])) {
            [$userId, $more] = keep_restorer_signed_in($me, $session);
            $notes = array_merge($notes, $more);
        }
        q('INSERT INTO activity_log (at, user_id, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, NULL, ?)',
            [now(), $userId, 'restored', 'backup', mb_substr('Restored a backup made ' . ($m['created_at'] ?? 'earlier'), 0, 255)]);

        if (!$m['partial']) {
            // Swap the photo folder last: two renames, undone if the database can't commit.
            if (is_dir("$live/media") && !@rename("$live/media", $oldMedia)) {
                throw new HttpError(500, 'Could not replace the photos on the server, so nothing was changed. Please try again.', 'storage');
            }
            if (!@rename($staged, "$live/media")) {
                @rename($oldMedia, "$live/media");
                throw new HttpError(500, 'Could not replace the photos on the server, so nothing was changed. Please try again.', 'storage');
            }
            $swapped = true;
        }
        db()->commit();
    } catch (Throwable $e) {
        if (db()->inTransaction()) {
            db()->rollBack();
        }
        if ($swapped) {
            @rename("$live/media", $staged);
            @rename($oldMedia, "$live/media");
        }
        throw $e;
    } finally {
        db()->exec('SET FOREIGN_KEY_CHECKS = 1');
        scalar("SELECT RELEASE_LOCK('tk_restore')");
    }

    // 3. The website follows whatever is now the latest published version.
    write_live_content(one('SELECT * FROM cms_revisions ORDER BY id DESC LIMIT 1'));
    rrmdir($oldMedia);
    restore_cleanup($token);
    return ['restored' => $counts, 'files' => count($m['files']), 'notes' => $notes];
}
