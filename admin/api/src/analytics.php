<?php
// Cookieless website analytics. The site sends small beacons to
// /api/public/ping; a visitor is identified only by a hash of a salt that
// changes every day, their IP and their browser, so nobody can be followed
// from one day to the next and no IP address is ever written down.

declare(strict_types=1);

const GOALS = ['whatsapp', 'amazon', 'call', 'email', 'instagram', 'google_reviews', 'bulk_enquiry', 'contact_message', 'outbound'];
const BOTS = '/bot|crawl|spider|slurp|headless|lighthouse|pagespeed|pingdom|uptime|monitor|preview|facebookexternalhit|embedly|curl|wget|python|httpclient|okhttp|go-http|java\/|phantom|puppeteer|playwright|selenium/i';

// ---------------------------------------------------------------- collect

function daily_salt(string $day): string
{
    $stored = json_decode((string) scalar("SELECT v FROM settings WHERE k = 'analytics_salt'"), true);
    if (($stored['day'] ?? '') === $day) {
        return (string) $stored['salt'];
    }
    $next = json_encode(['day' => $day, 'salt' => bin2hex(random_bytes(16))]);
    q("INSERT INTO settings (k, v) VALUES ('analytics_salt', ?) ON DUPLICATE KEY UPDATE v = IF(v LIKE ?, v, VALUES(v))", [$next, '{"day":"' . $day . '"%']);
    // Re-read: if two requests raced at midnight, both now use the winner.
    return (string) json_decode((string) scalar("SELECT v FROM settings WHERE k = 'analytics_salt'"), true)['salt'];
}

function parse_agent(string $ua, int $screen): array
{
    $browser = match (true) {
        str_contains($ua, 'Instagram') => 'Instagram app',
        (bool) preg_match('/FBAN|FBAV|FB_IAB/', $ua) => 'Facebook app',
        str_contains($ua, 'WhatsApp') => 'WhatsApp',
        str_contains($ua, 'Edg/') || str_contains($ua, 'EdgA/') || str_contains($ua, 'EdgiOS') => 'Edge',
        str_contains($ua, 'OPR/') || str_contains($ua, 'Opera') => 'Opera',
        str_contains($ua, 'SamsungBrowser') => 'Samsung Internet',
        str_contains($ua, 'UCBrowser') => 'UC Browser',
        str_contains($ua, 'Firefox') || str_contains($ua, 'FxiOS') => 'Firefox',
        str_contains($ua, 'Chrome') || str_contains($ua, 'CriOS') => 'Chrome',
        str_contains($ua, 'Safari') => 'Safari',
        default => 'Other',
    };
    $os = match (true) {
        (bool) preg_match('/iPhone|iPad|iPod/', $ua) => 'iOS',
        str_contains($ua, 'Android') => 'Android',
        str_contains($ua, 'Windows') => 'Windows',
        str_contains($ua, 'CrOS') => 'ChromeOS',
        str_contains($ua, 'Mac OS X') || str_contains($ua, 'Macintosh') => 'macOS',
        str_contains($ua, 'Linux') => 'Linux',
        default => 'Other',
    };
    $device = match (true) {
        str_contains($ua, 'iPad') || (str_contains($ua, 'Android') && !str_contains($ua, 'Mobile')) => 'tablet',
        (bool) preg_match('/Mobi|iPhone|iPod|Android/', $ua) => 'mobile',
        // iPadOS reports itself as a Mac; its screen gives it away.
        $os === 'macOS' && $screen > 0 && $screen <= 1366 && str_contains($ua, 'Safari') && !str_contains($ua, 'Chrome') => 'tablet',
        default => 'desktop',
    };
    return [$device, $browser, $os];
}

function country_from_timezone(string $tz): ?string
{
    $aliases = ['Asia/Calcutta' => 'IN', 'Asia/Kolkata' => 'IN', 'Asia/Katmandu' => 'NP', 'Asia/Saigon' => 'VN', 'Asia/Rangoon' => 'MM', 'Europe/Kiev' => 'UA'];
    if (isset($aliases[$tz])) {
        return $aliases[$tz];
    }
    if ($tz === '' || !preg_match('#^[A-Za-z_]+(/[A-Za-z0-9_+\-]+){1,2}$#', $tz)) {
        return null;
    }
    try {
        $cc = (new DateTimeZone($tz))->getLocation()['country_code'] ?? '??';
    } catch (Throwable) {
        return null;
    }
    return preg_match('/^[A-Z]{2}$/', $cc) ? $cc : null;
}

function host_of(string $url): ?string
{
    $h = strtolower((string) parse_url($url, PHP_URL_HOST));
    return $h === '' ? null : substr(preg_replace('/^www\./', '', $h), 0, 120);
}

/** Accepts beacons only from the website itself (and localhost while developing). */
function from_site(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $origin !== '' && $origin !== 'null' ? host_of($origin) : host_of($_SERVER['HTTP_REFERER'] ?? '');
    if ($host === null) {
        return false;
    }
    $allowed = array_map(fn ($h) => preg_replace('/^www\./', '', strtolower($h)), site_hosts());
    return in_array($host, $allowed, true) || (!empty(config()['debug']) && in_array($host, ['localhost', '127.0.0.1'], true));
}

function collect(): never
{
    header('Access-Control-Allow-Origin: *');
    $done = function (): never {
        http_response_code(204);
        exit;
    };
    $ua = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 400);
    $raw = file_get_contents('php://input', false, null, 0, 4096);
    $in = json_decode((string) $raw, true);
    if (!is_array($in) || $ua === '' || preg_match(BOTS, $ua) || !from_site()) {
        $done();
    }

    $day = today();
    $ts = now();
    $visitor = substr(hash('sha256', daily_salt($day) . '|' . client_ip() . '|' . $ua), 0, 16);
    $str = fn (string $k, int $max) => mb_substr(trim((string) (is_scalar($in[$k] ?? null) ? $in[$k] : '')), 0, $max);
    $id = $str('id', 16);
    $path = '/' . ltrim((string) parse_url($str('p', 255), PHP_URL_PATH), '/');

    switch ($in['k'] ?? '') {
        case 'pv':
            if (!preg_match('/^[0-9a-f]{16}$/', $id)) {
                $done();
            }
            // A runaway script on one browser shouldn't flood the numbers.
            if ((int) scalar('SELECT COUNT(*) FROM analytics_views WHERE visitor = ? AND day = ?', [$visitor, $day]) > 800) {
                $done();
            }
            $screen = max(0, min(10000, (int) ($in['w'] ?? 0)));
            [$device, $browser, $os] = parse_agent($ua, $screen);
            $ref = host_of($str('r', 500));
            if ($ref !== null && in_array($ref, array_map(fn ($h) => preg_replace('/^www\./', '', $h), site_hosts()), true)) {
                $ref = null;
            }
            $null = fn (string $v) => $v === '' ? null : $v;
            q('INSERT IGNORE INTO analytics_views (pv, at, day, last_seen, visitor, path, ref_host, utm_source, utm_medium, utm_campaign, device, browser, os, country, lang)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                $id, $ts, $day, $ts, $visitor, $path, $ref,
                $null(strtolower($str('us', 80))), $null(strtolower($str('um', 80))), $null($str('uc', 120)),
                $device, $browser, $os, country_from_timezone($str('tz', 64)), $null(strtolower($str('l', 12))),
            ]);
            if (random_int(1, 400) === 1) {
                prune_analytics();
            }
            break;

        case 'eng':
            if (preg_match('/^[0-9a-f]{16}$/', $id)) {
                q('UPDATE analytics_views SET engaged = GREATEST(engaged, ?), depth = GREATEST(depth, ?), last_seen = ? WHERE pv = ? AND day >= ?', [
                    max(0, min(7200, (int) ($in['t'] ?? 0))), max(0, min(100, (int) ($in['d'] ?? 0))), $ts, $id,
                    (new DateTimeImmutable($day))->modify('-1 day')->format('Y-m-d'),
                ]);
            }
            break;

        case 'ev':
            $name = $str('n', 40);
            if (in_array($name, GOALS, true)) {
                $pv = $str('pv', 16);
                q('INSERT INTO analytics_events (at, day, visitor, pv, name, label, path) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                    $ts, $day, $visitor, preg_match('/^[0-9a-f]{16}$/', $pv) ? $pv : null, $name, $str('x', 120), $path,
                ]);
            }
            break;
    }
    $done();
}

/** Keeps a little over two years of history. */
function prune_analytics(): void
{
    $cut = (new DateTimeImmutable(today()))->modify('-25 months')->format('Y-m-d');
    q('DELETE FROM analytics_views WHERE day < ? LIMIT 5000', [$cut]);
    q('DELETE FROM analytics_events WHERE day < ? LIMIT 5000', [$cut]);
}

// ---------------------------------------------------------------- reports

function source_of(?string $host, ?string $utm): string
{
    $s = strtolower((string) ($utm ?: $host));
    if ($s === '') {
        return 'Direct';
    }
    $map = [
        'google' => 'Google', 'bing' => 'Bing', 'duckduckgo' => 'DuckDuckGo', 'yahoo' => 'Yahoo',
        'instagram' => 'Instagram', 'facebook' => 'Facebook', 'fb' => 'Facebook', 'whatsapp' => 'WhatsApp', 'wa.me' => 'WhatsApp',
        'youtube' => 'YouTube', 'linkedin' => 'LinkedIn', 't.co' => 'X (Twitter)', 'twitter' => 'X (Twitter)', 'x.com' => 'X (Twitter)',
        'amazon' => 'Amazon', 'chatgpt' => 'ChatGPT', 'openai' => 'ChatGPT', 'perplexity' => 'Perplexity', 'pinterest' => 'Pinterest',
    ];
    foreach ($map as $needle => $label) {
        if ($s === $needle || str_contains($s, $needle . '.') || str_starts_with($s, $needle) || str_contains($s, '.' . $needle)) {
            return $label;
        }
    }
    return $utm ?: $host;
}

/**
 * Rebuilds visits (sessions) from page views: a visit ends after 30 minutes
 * without a new page. Streams the rows so memory stays flat as traffic grows.
 */
function sessions(string $from, string $to): array
{
    $pdo = db();
    $pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);
    $st = $pdo->prepare('SELECT visitor, UNIX_TIMESTAMP(at) AS t, path, ref_host, utm_source, engaged FROM analytics_views WHERE day BETWEEN ? AND ? ORDER BY visitor, at');
    $st->execute([$from, $to]);

    $out = ['sessions' => 0, 'bounces' => 0, 'duration' => 0, 'views' => 0, 'entries' => [], 'sources' => []];
    $cur = null;
    $close = function () use (&$cur, &$out) {
        if (!$cur) {
            return;
        }
        $out['sessions']++;
        $out['views'] += $cur['views'];
        $out['duration'] += min(14400, $cur['last'] - $cur['first'] + $cur['lastEngaged']);
        if ($cur['views'] === 1 && $cur['lastEngaged'] < 10) {
            $out['bounces']++;
        }
        $out['entries'][$cur['entry']] = ($out['entries'][$cur['entry']] ?? 0) + 1;
        $out['sources'][$cur['source']] = ($out['sources'][$cur['source']] ?? 0) + 1;
        $cur = null;
    };
    while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
        $t = (int) $r['t'];
        if (!$cur || $cur['visitor'] !== $r['visitor'] || $t - $cur['last'] > 1800) {
            $close();
            $cur = ['visitor' => $r['visitor'], 'first' => $t, 'last' => $t, 'views' => 0, 'entry' => $r['path'], 'source' => source_of($r['ref_host'], $r['utm_source']), 'lastEngaged' => 0];
        }
        $cur['views']++;
        $cur['last'] = $t;
        $cur['lastEngaged'] = (int) $r['engaged'];
    }
    $close();
    $st->closeCursor();
    $pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);
    return $out;
}

function period_totals(string $from, string $to): array
{
    $s = sessions($from, $to);
    $visitors = (int) scalar('SELECT COUNT(DISTINCT visitor, day) FROM analytics_views WHERE day BETWEEN ? AND ?', [$from, $to]);
    $converted = (int) scalar("SELECT COUNT(DISTINCT visitor, day) FROM analytics_events WHERE day BETWEEN ? AND ? AND name <> 'outbound'", [$from, $to]);
    return [
        'totals' => [
            'visitors' => $visitors,
            'views' => $s['views'],
            'sessions' => $s['sessions'],
            'views_per_visit' => $s['sessions'] ? round($s['views'] / $s['sessions'], 2) : 0,
            'bounce_rate' => $s['sessions'] ? round($s['bounces'] / $s['sessions'] * 100, 1) : 0,
            'avg_duration' => $s['sessions'] ? (int) round($s['duration'] / $s['sessions']) : 0,
            'conversion_rate' => $visitors ? round($converted / $visitors * 100, 1) : 0,
        ],
        'sessions' => $s,
    ];
}

function top(array $counts, int $n = 12): array
{
    arsort($counts);
    return array_map(fn ($k, $v) => ['label' => (string) $k, 'count' => $v], array_keys(array_slice($counts, 0, $n, true)), array_slice($counts, 0, $n, true));
}

function analytics_overview(string $from, string $to): array
{
    $days = (int) (new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->days + 1;
    $prevTo = (new DateTimeImmutable($from))->modify('-1 day')->format('Y-m-d');
    $prevFrom = (new DateTimeImmutable($from))->modify("-$days day")->format('Y-m-d');

    $cur = period_totals($from, $to);
    $prev = period_totals($prevFrom, $prevTo)['totals'];
    $range = [$from, $to];

    // Over time: by hour for a single day, by day otherwise.
    if ($from === $to) {
        $series = array_fill(0, 24, null);
        foreach (rows('SELECT HOUR(at) AS h, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM analytics_views WHERE day = ? GROUP BY h', [$from]) as $r) {
            $series[(int) $r['h']] = $r;
        }
        $series = array_map(fn ($r, $h) => ['key' => sprintf('%02d:00', $h), 'visitors' => (int) ($r['visitors'] ?? 0), 'views' => (int) ($r['views'] ?? 0)], $series, array_keys($series));
    } else {
        $byDay = [];
        foreach (rows('SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM analytics_views WHERE day BETWEEN ? AND ? GROUP BY day', $range) as $r) {
            $byDay[$r['day']] = $r;
        }
        $series = [];
        for ($d = new DateTimeImmutable($from); $d->format('Y-m-d') <= $to; $d = $d->modify('+1 day')) {
            $k = $d->format('Y-m-d');
            $series[] = ['key' => $k, 'visitors' => (int) ($byDay[$k]['visitors'] ?? 0), 'views' => (int) ($byDay[$k]['views'] ?? 0)];
        }
    }

    $pages = array_map(fn ($r) => ['path' => $r['path'], 'views' => (int) $r['views'], 'visitors' => (int) $r['visitors'], 'avg_engaged' => (int) round((float) $r['eng']), 'avg_depth' => (int) round((float) $r['depth'])],
        rows('SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor, day) AS visitors, AVG(engaged) AS eng, AVG(NULLIF(depth, 0)) AS depth FROM analytics_views WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY views DESC LIMIT 20', $range));

    $breakdown = function (string $col) use ($range) {
        return array_map(fn ($r) => ['label' => (string) ($r['v'] ?? ''), 'count' => (int) $r['n']],
            rows("SELECT $col AS v, COUNT(DISTINCT visitor, day) AS n FROM analytics_views WHERE day BETWEEN ? AND ? GROUP BY v ORDER BY n DESC LIMIT 12", $range));
    };

    $goals = [];
    foreach (rows('SELECT name, COUNT(*) AS n, COUNT(DISTINCT visitor, day) AS visitors FROM analytics_events WHERE day BETWEEN ? AND ? GROUP BY name', $range) as $r) {
        $goals[$r['name']] = ['count' => (int) $r['n'], 'visitors' => (int) $r['visitors'], 'labels' => []];
    }
    foreach (rows("SELECT name, label, COUNT(*) AS n FROM analytics_events WHERE day BETWEEN ? AND ? AND label <> '' GROUP BY name, label ORDER BY n DESC", $range) as $r) {
        if (count($goals[$r['name']]['labels'] ?? []) < 8) {
            $goals[$r['name']]['labels'][] = ['label' => $r['label'], 'count' => (int) $r['n']];
        }
    }
    $prevGoals = array_column(rows('SELECT name, COUNT(*) AS n FROM analytics_events WHERE day BETWEEN ? AND ? GROUP BY name', [$prevFrom, $prevTo]), 'n', 'name');
    foreach ($goals as $k => &$g) {
        $g['previous'] = (int) ($prevGoals[$k] ?? 0);
    }
    unset($g);

    return [
        'from' => $from,
        'to' => $to,
        'previous' => ['from' => $prevFrom, 'to' => $prevTo, 'totals' => $prev],
        'totals' => $cur['totals'],
        'series' => $series,
        'pages' => $pages,
        'entries' => top($cur['sessions']['entries']),
        'sources' => top($cur['sessions']['sources']),
        'campaigns' => $breakdown('utm_campaign'),
        'devices' => $breakdown('device'),
        'browsers' => $breakdown('browser'),
        'os' => $breakdown('os'),
        'countries' => $breakdown('country'),
        'goals' => $goals,
        'first_day' => scalar('SELECT MIN(day) FROM analytics_views'),
    ];
}

function analytics_live(): array
{
    $since = (new DateTimeImmutable(now()))->modify('-5 minutes')->format('Y-m-d H:i:s');
    return [
        'visitors' => (int) scalar('SELECT COUNT(DISTINCT visitor) FROM analytics_views WHERE last_seen >= ?', [$since]),
        'pages' => array_map(fn ($r) => ['label' => $r['path'], 'count' => (int) $r['n']],
            rows('SELECT path, COUNT(DISTINCT visitor) AS n FROM analytics_views WHERE last_seen >= ? GROUP BY path ORDER BY n DESC LIMIT 8', [$since])),
        'recent' => array_map(fn ($r) => ['at' => $r['at'], 'path' => $r['path'], 'source' => source_of($r['ref_host'], $r['utm_source']), 'device' => $r['device'], 'country' => $r['country']],
            rows('SELECT at, path, ref_host, utm_source, device, country FROM analytics_views ORDER BY id DESC LIMIT 12')),
        'events' => array_map(fn ($r) => ['at' => $r['at'], 'name' => $r['name'], 'label' => $r['label'], 'path' => $r['path']],
            rows('SELECT at, name, label, path FROM analytics_events ORDER BY id DESC LIMIT 12')),
    ];
}

function route_analytics(string $what): mixed
{
    $date = fn (string $k, string $fallback) => isset($_GET[$k]) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $_GET[$k]) ? (string) $_GET[$k] : $fallback;
    return match ($what) {
        'overview' => (function () use ($date) {
            $to = $date('to', today());
            $from = $date('from', (new DateTimeImmutable($to))->modify('-29 days')->format('Y-m-d'));
            if ($from > $to) {
                [$from, $to] = [$to, $from];
            }
            if ((new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->days > 800) {
                throw new HttpError(422, 'Please choose a shorter date range.', 'validation');
            }
            return analytics_overview($from, $to);
        })(),
        'live' => analytics_live(),
        default => throw new HttpError(404, 'Not found.'),
    };
}
