<?php
// Shared plumbing: config, database, JSON in/out, auth, activity log.

declare(strict_types=1);

final class HttpError extends Exception
{
    public function __construct(public int $status, string $message, public ?string $errCode = null, public array $extra = [])
    {
        parent::__construct($message);
    }
}

function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $file = __DIR__ . '/../config.php';
        if (!is_file($file)) {
            throw new HttpError(500, 'The dashboard is not configured yet (config.php missing).');
        }
        $cfg = require $file;
    }
    return $cfg;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config()['db'];
        $pdo = new PDO(
            "mysql:host={$c['host']};port=" . ($c['port'] ?? 3306) . ";dbname={$c['name']};charset=utf8mb4",
            $c['user'],
            $c['pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        $pdo->exec("SET time_zone = '+05:30'");
    }
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function rows(string $sql, array $params = []): array
{
    return q($sql, $params)->fetchAll();
}

function one(string $sql, array $params = []): ?array
{
    $r = q($sql, $params)->fetch();
    return $r === false ? null : $r;
}

function scalar(string $sql, array $params = []): mixed
{
    $v = q($sql, $params)->fetchColumn();
    return $v === false ? null : $v;
}

function now(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format('Y-m-d H:i:s');
}

function today(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format('Y-m-d');
}

function input(): array
{
    static $data = null;
    if ($data === null) {
        $raw = file_get_contents('php://input');
        $data = $raw === '' || $raw === false ? [] : json_decode($raw, true);
        if (!is_array($data)) {
            throw new HttpError(400, 'Could not read the request.');
        }
    }
    return $data;
}

function send(mixed $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    exit;
}

// ---------------------------------------------------------------- install

function ensure_installed(): void
{
    $exists = scalar("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'settings'");
    if ((int) $exists > 0) {
        return;
    }
    $sql = file_get_contents(__DIR__ . '/../schema.sql');
    // Strip comments, then run statement by statement.
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
        db()->exec($stmt);
    }
    seed_master_data();
}

function seed_master_data(): void
{
    $seed = [
        'designs' => ['Morning Spring', 'Old Thanda Kapda design', 'Plain white', 'Namaste', "Degchi's", "Abiz's", 'Hakimee', 'Supreme', 'Mocha', 'Flavors and Colours'],
        'locations' => ['Fakhri Hills', 'A S Enterprise', 'Business Centre', 'Amour Affairs', "Hamza's house"],
        'accounts' => ['Quadracore Current account', 'Jameela A/c', 'Cash', 'Hamza A/c', 'Shabbir Piplodwala A/c'],
        'categories' => ['Packaging & Manufacturing', 'Transportation & Logistics', 'Marketing & Influencers', 'Legal & Professional Services', 'Website & IT', 'Telecom', 'Office Supplies & Stationery', 'Design & Creative', 'Samples & Materials', 'Testing & Quality', 'Refunds', 'Business Meetings & Entertainment', 'Other'],
        'people' => ['Hamza', 'Shabbir Piplodwala'],
    ];
    $ts = now();
    foreach ($seed as $table => $names) {
        foreach ($names as $i => $name) {
            q("INSERT INTO $table (name, sort, created_at, updated_at) VALUES (?, ?, ?, ?)", [$name, $i, $ts, $ts]);
        }
    }
    q("INSERT INTO settings (k, v) VALUES ('business_name', 'Thanda Kapda')");
}

// ---------------------------------------------------------------- auth

const SESSION_COOKIE = 'tk_session';
const SESSION_DAYS = 30;

function current_user(): ?array
{
    static $user = false;
    if ($user !== false) {
        return $user;
    }
    $user = null;
    $token = $_COOKIE[SESSION_COOKIE] ?? '';
    if (is_string($token) && strlen($token) === 64) {
        $user = one(
            'SELECT u.id, u.name, u.email, u.role, u.theme FROM sessions s JOIN users u ON u.id = s.user_id
             WHERE s.token_hash = ? AND s.expires_at > NOW() AND u.active = 1',
            [hash('sha256', $token)]
        );
        if ($user) {
            $user['id'] = (int) $user['id'];
        }
    }
    return $user;
}

function require_user(): array
{
    $u = current_user();
    if (!$u) {
        throw new HttpError(401, 'Please log in again.', 'auth');
    }
    return $u;
}

function require_owner(): array
{
    $u = require_user();
    if ($u['role'] !== 'owner') {
        throw new HttpError(403, 'Only an owner can do this.');
    }
    return $u;
}

function uid(): ?int
{
    return current_user()['id'] ?? null;
}

function start_session(int $userId): void
{
    $token = bin2hex(random_bytes(32));
    $expires = time() + SESSION_DAYS * 86400;
    q('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, FROM_UNIXTIME(?))', [hash('sha256', $token), $userId, $expires]);
    q('DELETE FROM sessions WHERE expires_at < NOW()');
    set_session_cookie($token, $expires);
}

function end_session(): void
{
    $token = $_COOKIE[SESSION_COOKIE] ?? '';
    if (is_string($token) && $token !== '') {
        q('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $token)]);
    }
    set_session_cookie('', time() - 3600);
}

function set_session_cookie(string $value, int $expires): void
{
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    setcookie(SESSION_COOKIE, $value, [
        'expires' => $expires,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function client_ip(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64);
}

function throttle_login(): void
{
    $recent = (int) scalar('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND at > (NOW() - INTERVAL 15 MINUTE)', [client_ip()]);
    if ($recent >= 10) {
        throw new HttpError(429, 'Too many wrong attempts. Please wait 15 minutes and try again.');
    }
}

// ---------------------------------------------------------------- activity

function log_activity(string $action, string $entity, ?int $id, string $summary, mixed $data = null): void
{
    q(
        'INSERT INTO activity_log (at, user_id, action, entity, entity_id, summary, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [now(), uid(), $action, $entity, $id, mb_substr($summary, 0, 255), $data === null ? null : json_encode($data, JSON_UNESCAPED_UNICODE)]
    );
}

// The sync version is simply the newest activity-log id: every write logs, so
// clients polling this number know when anything has changed.
function data_version(): int
{
    return (int) (scalar('SELECT MAX(id) FROM activity_log') ?? 0);
}
