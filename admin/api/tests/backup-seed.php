<?php
// Adds data to a scratch database that the API can't create directly, for
// backup.test.ts: thousands of visitor rows (more than one page), awkward
// values, a photo larger than one upload piece, an empty file and a stray
// non-photo file. Run with TK_CONFIG pointing at the scratch server's config.

declare(strict_types=1);

require __DIR__ . '/../src/core.php';

if (!getenv('TK_CONFIG')) {
    fwrite(STDERR, "Set TK_CONFIG to a scratch server's config. Never run this on real data.\n");
    exit(1);
}
$base = rtrim((string) $argv[1], '/');

// Visitors: 4,500 page views and 2,100 events, so every table spans several pages.
$views = [];
for ($i = 1; $i <= 4500; $i++) {
    $day = date('Y-m-d', strtotime("2026-01-01 +" . ($i % 300) . ' days'));
    $views[] = [sprintf('%016x', 0x5eed0000 + $i), "$day 10:00:00", $day, "$day 10:01:00", sprintf('%016x', $i % 700), $i % 3 ? '/' : '/products/namaste/',
        $i % 5 ? 'www.google.com' : null, $i % 7 ? null : 'insta', null, null, $i % 2 ? 'mobile' : 'desktop', 'Chrome', 'Android', $i % 4 ? 'IN' : null, 'en-IN', $i % 90, $i % 101];
}
foreach (array_chunk($views, 500) as $chunk) {
    q('INSERT INTO analytics_views (pv, at, day, last_seen, visitor, path, ref_host, utm_source, utm_medium, utm_campaign, device, browser, os, country, lang, engaged, depth) VALUES '
        . implode(',', array_fill(0, count($chunk), '(' . implode(',', array_fill(0, 17, '?')) . ')')), array_merge(...$chunk));
}
$events = [];
for ($i = 1; $i <= 2100; $i++) {
    $events[] = ["2026-03-01 12:00:00", '2026-03-01', sprintf('%016x', $i % 700), sprintf('%016x', 0x5eed0000 + $i), $i % 2 ? 'amazon' : 'whatsapp', "label “{$i}” é", '/'];
}
foreach (array_chunk($events, 500) as $chunk) {
    q('INSERT INTO analytics_events (at, day, visitor, pv, name, label, path) VALUES ' . implode(',', array_fill(0, count($chunk), '(?,?,?,?,?,?,?)')), array_merge(...$chunk));
}

// Settings with awkward text, and one that must never travel (it belongs to the server).
q("INSERT INTO settings (k, v) VALUES ('business_name', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)", ["Thanda Kapda “Co.” — ठंडा कपड़ा 😀\nline 2 \\ back"]);
q("INSERT INTO settings (k, v) VALUES ('empty_value', NULL) ON DUPLICATE KEY UPDATE v = NULL");

// Photos: one bigger than an upload piece (several requests), one empty file, one stray file.
$media = live_dir() . '/media/2026/11';
@mkdir($media, 0755, true);
$png = "\x89PNG\r\n\x1a\n" . pack('N', 13) . 'IHDR' . pack('NNCCCCC', 2400, 1600, 8, 2, 0, 0, 0) . pack('N', 0);
file_put_contents("$media/9001-big-2400.png", $png . random_bytes(2_700_000));
file_put_contents("$media/9002-empty-640.webp", '');
file_put_contents(live_dir() . '/media/stray.txt', 'not a photo');
q("INSERT INTO cms_media (id, name, alt, path, ext, widths, width, height, bytes, created_at) VALUES (9001, 'Big “photo”', 'alt é', '2026/11/9001-big', 'png', '2400', 2400, 1600, 2700033, NOW())");

// A draft that points at the big photo by its full address on this server.
q('UPDATE cms_draft SET data = ? WHERE id = 1', [json_encode(['site' => ['name' => 'Draft “é”'], 'home' => ['hero' => ['firstPhoto' => ['src' => "$base/live/media/2026/11/9001-big-2400.png#w=2400", 'zoom' => 1.0]]]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION)]);
echo "seeded\n";
