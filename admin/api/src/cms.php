<?php
// Website content: one shared draft, published revisions, and the photo
// library. Publishing writes live/content.json, which the website reads on
// every visit, so changes are live without rebuilding the site.

declare(strict_types=1);

const CMS_MAX_BYTES = 1_500_000;
const MEDIA_MAX_FILE = 8 * 1024 * 1024;
const MEDIA_TYPES = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];

// ---------------------------------------------------------------- storage

/** Creates live/ and live/media/ and the first content.json. Returns false if the folder isn't writable. */
function ensure_storage(): bool
{
    $dir = live_dir();
    foreach ([$dir, "$dir/media"] as $d) {
        if (!is_dir($d) && !@mkdir($d, 0755, true) && !is_dir($d)) {
            return false;
        }
    }
    if (!is_file("$dir/content.json")) {
        $latest = one('SELECT * FROM cms_revisions ORDER BY id DESC LIMIT 1');
        return write_live_content($latest);
    }
    return is_writable("$dir/content.json");
}

/** Writes the published content atomically, so a visitor never reads half a file. */
function write_live_content(?array $rev): bool
{
    $payload = [
        'version' => $rev ? (int) $rev['id'] : 0,
        'publishedAt' => $rev['created_at'] ?? null,
        'content' => $rev ? json_decode($rev['data'], true) : null,
    ];
    $file = live_dir() . '/content.json';
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    @chmod($tmp, 0644);
    if (!@rename($tmp, $file)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

/** What the storage check reports in Settings. */
function storage_status(): array
{
    $dir = live_dir();
    return [
        'writable' => ensure_storage() && is_writable("$dir/media"),
        'content_url' => public_base() . '/live/content.json',
        'upload_limit' => ini_get('upload_max_filesize'),
        'post_limit' => ini_get('post_max_size'),
        'php' => PHP_VERSION,
    ];
}

// ---------------------------------------------------------------- content

/**
 * Keeps only plain JSON values (text, numbers, true/false, lists, objects) at a
 * sane depth and size. The website re-checks every field's shape on load.
 */
function clean_content(mixed $v, int $depth = 0): mixed
{
    if ($depth > 10) {
        throw new HttpError(422, 'The content is nested too deeply.', 'validation');
    }
    if (is_string($v)) {
        return mb_substr(str_replace("\r\n", "\n", $v), 0, 6000);
    }
    if (is_int($v) || is_float($v)) {
        return is_finite((float) $v) ? $v : 0;
    }
    if (is_bool($v) || $v === null) {
        return $v;
    }
    if (is_array($v)) {
        if (count($v) > 300) {
            throw new HttpError(422, 'A list in the content is too long.', 'validation');
        }
        $out = [];
        foreach ($v as $k => $x) {
            $out[$k] = clean_content($x, $depth + 1);
        }
        return $out;
    }
    return null;
}

function content_json(mixed $data): string
{
    if (!is_array($data) || array_is_list($data)) {
        throw new HttpError(422, 'The content could not be read.', 'validation');
    }
    $json = json_encode(clean_content($data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    if ($json === false || strlen($json) > CMS_MAX_BYTES) {
        throw new HttpError(422, 'The content is too large to save.', 'validation');
    }
    return $json;
}

function cms_state(): array
{
    $d = one('SELECT d.*, u.name FROM cms_draft d LEFT JOIN users u ON u.id = d.updated_by WHERE d.id = 1');
    $p = one('SELECT r.*, u.name FROM cms_revisions r LEFT JOIN users u ON u.id = r.created_by ORDER BY r.id DESC LIMIT 1');
    return [
        'draft' => $d && $d['data'] !== null ? json_decode($d['data'], true) : null,
        'draft_updated_at' => $d['updated_at'] ?? null,
        'draft_updated_by' => $d['name'] ?? null,
        'published' => $p ? [
            'id' => (int) $p['id'],
            'created_at' => $p['created_at'],
            'created_by' => $p['name'],
            'note' => $p['note'],
            'data' => json_decode($p['data'], true),
        ] : null,
        'storage_ok' => ensure_storage(),
    ];
}

/** Refuses to overwrite a draft someone else saved after this editor last loaded it. */
function check_draft_base(array $in): void
{
    if (!empty($in['force'])) {
        return;
    }
    $current = scalar('SELECT updated_at FROM cms_draft WHERE id = 1');
    $seen = $in['updated_at'] ?? null;
    if (($current ?? null) !== ($seen ?: null)) {
        $by = scalar('SELECT u.name FROM cms_draft d LEFT JOIN users u ON u.id = d.updated_by WHERE d.id = 1');
        throw new HttpError(409, ($by ? "$by" : 'Someone') . ' changed the website draft since you opened it.', 'conflict', ['updated_at' => $current]);
    }
}

function route_cms(string $method, array $p): mixed
{
    $a = $p[1] ?? '';
    $id = isset($p[2]) && ctype_digit($p[2]) ? (int) $p[2] : null;

    if ($a === '' && $method === 'GET') {
        return cms_state();
    }

    if ($a === 'draft' && $method === 'PUT') {
        $in = input();
        $json = content_json($in['data'] ?? null);
        db()->beginTransaction();
        try {
            q('SELECT id FROM cms_draft WHERE id = 1 FOR UPDATE');
            check_draft_base($in);
            $ts = now();
            q('UPDATE cms_draft SET data = ?, updated_at = ?, updated_by = ? WHERE id = 1', [$json, $ts, uid()]);
            db()->commit();
        } catch (Throwable $e) {
            db()->rollBack();
            throw $e;
        }
        return ['updated_at' => $ts];
    }

    if ($a === 'draft' && $method === 'DELETE') {
        $ts = now();
        q('UPDATE cms_draft SET data = NULL, updated_at = ?, updated_by = ? WHERE id = 1', [$ts, uid()]);
        log_activity('discarded', 'website', null, 'Discarded unpublished website changes');
        return ['updated_at' => $ts];
    }

    if ($a === 'publish' && $method === 'POST') {
        $in = input();
        $json = content_json($in['data'] ?? null);
        $note = mb_substr(trim((string) ($in['note'] ?? '')), 0, 255);
        if (!ensure_storage()) {
            throw new HttpError(500, 'The dashboard can’t write to its “live” folder on the server, so the website can’t be updated. Ask your host to make it writable (see Settings → Website storage).', 'storage');
        }
        db()->beginTransaction();
        try {
            q('SELECT id FROM cms_draft WHERE id = 1 FOR UPDATE');
            check_draft_base($in);
            $ts = now();
            q('INSERT INTO cms_revisions (data, note, created_at, created_by) VALUES (?, ?, ?, ?)', [$json, $note ?: null, $ts, uid()]);
            $revId = (int) db()->lastInsertId();
            q('UPDATE cms_draft SET data = NULL, base_revision = ?, updated_at = ?, updated_by = ? WHERE id = 1', [$revId, $ts, uid()]);
            $rev = one('SELECT * FROM cms_revisions WHERE id = ?', [$revId]);
            if (!write_live_content($rev)) {
                throw new HttpError(500, 'Saved, but the live file could not be written. Nothing changed on the website. Please try again.', 'storage');
            }
            log_activity('published', 'website', $revId, $note !== '' ? "Published the website: $note" : 'Published website changes');
            db()->commit();
        } catch (Throwable $e) {
            db()->rollBack();
            // The live file may already point at a revision that was rolled back.
            write_live_content(one('SELECT * FROM cms_revisions ORDER BY id DESC LIMIT 1'));
            throw $e;
        }
        return ['revision' => $revId, 'updated_at' => $ts, 'published_at' => $ts];
    }

    if ($a === 'revisions' && $method === 'GET') {
        if ($id) {
            $r = one('SELECT r.*, u.name FROM cms_revisions r LEFT JOIN users u ON u.id = r.created_by WHERE r.id = ?', [$id])
                ?? throw new HttpError(404, 'That version no longer exists.');
            return ['id' => (int) $r['id'], 'created_at' => $r['created_at'], 'created_by' => $r['name'], 'note' => $r['note'], 'data' => json_decode($r['data'], true)];
        }
        return array_map(fn ($r) => ['id' => (int) $r['id'], 'created_at' => $r['created_at'], 'created_by' => $r['name'], 'note' => $r['note'], 'bytes' => (int) $r['bytes']],
            rows('SELECT r.id, r.created_at, r.note, LENGTH(r.data) AS bytes, u.name FROM cms_revisions r LEFT JOIN users u ON u.id = r.created_by ORDER BY r.id DESC LIMIT 200'));
    }

    throw new HttpError(404, 'Not found.');
}

// ---------------------------------------------------------------- photos

function media_row(array $m): array
{
    $widths = array_map('intval', explode(',', $m['widths']));
    $max = max($widths);
    $url = public_base() . '/live/media/' . $m['path'] . '-' . $max . '.' . $m['ext'];
    return [
        'id' => (int) $m['id'],
        'name' => $m['name'],
        'alt' => $m['alt'],
        'url' => $url,
        // The form the website stores: largest file plus the other sizes.
        'src' => $url . '#w=' . implode(',', $widths),
        'thumb' => public_base() . '/live/media/' . $m['path'] . '-' . min($widths) . '.' . $m['ext'],
        'width' => (int) $m['width'],
        'height' => (int) $m['height'],
        'bytes' => (int) $m['bytes'],
        'widths' => $widths,
        'created_at' => $m['created_at'],
        'created_by' => $m['created_by'] === null ? null : (int) $m['created_by'],
    ];
}

function slugify(string $s): string
{
    $s = strtolower(preg_replace('/\.[a-z0-9]+$/i', '', $s));
    $s = trim(preg_replace('/[^a-z0-9]+/', '-', $s), '-');
    return substr($s !== '' ? $s : 'photo', 0, 40);
}

/** Where a photo is used: content paths in the draft and the live site. */
function media_usage(array $m): array
{
    $needle = '/live/media/' . $m['path'] . '-';
    $places = [];
    $walk = function (mixed $v, string $path) use (&$walk, &$places, $needle) {
        if (is_string($v) && str_contains($v, $needle)) {
            $places[] = $path;
        } elseif (is_array($v)) {
            foreach ($v as $k => $x) {
                $walk($x, $path === '' ? (string) $k : "$path.$k");
            }
        }
    };
    $s = cms_state();
    if ($s['draft']) {
        $walk($s['draft'], '');
    }
    if ($s['published']) {
        $walk($s['published']['data'], '');
    }
    // "home.hero.firstPhoto.src" → "home.hero.firstPhoto"
    return array_values(array_unique(array_map(fn ($p) => preg_replace('/\.src$/', '', $p), $places)));
}

/**
 * Upload: the browser has already resized the photo to several widths
 * (files named w640, w1080, …) and compressed them, so the server only checks
 * and stores them. Nothing is decoded or re-encoded here.
 */
function upload_media(): array
{
    if (empty($_FILES)) {
        $limit = ini_get('post_max_size');
        throw new HttpError(422, "The photo didn’t arrive. It may be larger than the server allows ($limit).", 'validation');
    }
    if (!ensure_storage()) {
        throw new HttpError(500, 'The server folder for photos isn’t writable. See Settings → Website storage.', 'storage');
    }
    $files = [];
    $ext = null;
    $total = 0;
    foreach ($_FILES as $key => $f) {
        if (!preg_match('/^w(\d{2,4})$/', (string) $key, $m)) {
            continue;
        }
        if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $why = in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? ' It’s larger than the server allows (' . ini_get('upload_max_filesize') . ').' : '';
            throw new HttpError(422, "One size of the photo failed to upload.$why", 'validation');
        }
        if ($f['size'] > MEDIA_MAX_FILE || !is_uploaded_file($f['tmp_name'])) {
            throw new HttpError(422, 'That photo is too large.', 'validation');
        }
        $info = @getimagesize($f['tmp_name']);
        if (!$info || !isset(MEDIA_TYPES[$info[2]])) {
            throw new HttpError(422, 'Please upload a JPG, PNG or WebP photo.', 'validation');
        }
        $w = (int) $m[1];
        if (abs($info[0] - $w) > 2) {
            throw new HttpError(422, 'The photo sizes didn’t match. Please try again.', 'validation');
        }
        $thisExt = MEDIA_TYPES[$info[2]];
        if ($ext !== null && $thisExt !== $ext) {
            throw new HttpError(422, 'All sizes of a photo must be the same format.', 'validation');
        }
        $ext = $thisExt;
        $files[$w] = ['tmp' => $f['tmp_name'], 'w' => $info[0], 'h' => $info[1], 'bytes' => (int) $f['size']];
        $total += (int) $f['size'];
    }
    if (!$files || count($files) > 8) {
        throw new HttpError(422, 'No photo was received.', 'validation');
    }
    ksort($files);
    $largest = end($files);
    $name = mb_substr(trim((string) ($_POST['name'] ?? 'Photo')), 0, 190) ?: 'Photo';
    $alt = mb_substr(trim((string) ($_POST['alt'] ?? '')), 0, 255);
    $folder = date('Y/m');
    $ts = now();

    db()->beginTransaction();
    $written = [];
    try {
        q('INSERT INTO cms_media (name, alt, path, ext, widths, width, height, bytes, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$name, $alt, '', $ext, implode(',', array_keys($files)), $largest['w'], $largest['h'], $total, $ts, uid()]);
        $id = (int) db()->lastInsertId();
        $path = "$folder/$id-" . slugify($name);
        $dir = live_dir() . "/media/$folder";
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new HttpError(500, 'Could not create the photo folder on the server.', 'storage');
        }
        foreach ($files as $w => $f) {
            $dest = live_dir() . "/media/$path-$w.$ext";
            if (!move_uploaded_file($f['tmp'], $dest)) {
                throw new HttpError(500, 'Could not save the photo on the server.', 'storage');
            }
            @chmod($dest, 0644);
            $written[] = $dest;
        }
        q('UPDATE cms_media SET path = ? WHERE id = ?', [$path, $id]);
        log_activity('uploaded', 'media', $id, "Uploaded photo “{$name}”");
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        foreach ($written as $f) {
            @unlink($f);
        }
        throw $e;
    }
    return media_row(one('SELECT * FROM cms_media WHERE id = ?', [$id]));
}

function route_media(string $method, ?int $id): mixed
{
    if ($method === 'GET' && !$id) {
        return array_map('media_row', rows('SELECT * FROM cms_media ORDER BY id DESC'));
    }
    if ($method === 'POST' && !$id) {
        return upload_media();
    }
    $m = $id ? one('SELECT * FROM cms_media WHERE id = ?', [$id]) : null;
    if (!$m) {
        throw new HttpError(404, 'That photo no longer exists.', 'gone');
    }
    if ($method === 'GET') {
        return media_row($m) + ['used_in' => media_usage($m)];
    }
    if ($method === 'PUT') {
        $in = input();
        q('UPDATE cms_media SET name = ?, alt = ? WHERE id = ?', [
            mb_substr(trim((string) ($in['name'] ?? $m['name'])), 0, 190) ?: $m['name'],
            mb_substr(trim((string) ($in['alt'] ?? $m['alt'])), 0, 255),
            $id,
        ]);
        return media_row(one('SELECT * FROM cms_media WHERE id = ?', [$id]));
    }
    if ($method === 'DELETE') {
        $used = media_usage($m);
        if ($used && empty($_GET['force'])) {
            throw new HttpError(422, 'This photo is used on the website. Replace it there first.', 'in_use', ['used_in' => $used]);
        }
        foreach (explode(',', $m['widths']) as $w) {
            @unlink(live_dir() . "/media/{$m['path']}-$w.{$m['ext']}");
        }
        q('DELETE FROM cms_media WHERE id = ?', [$id]);
        log_activity('deleted', 'media', $id, "Deleted photo “{$m['name']}”");
        return ['deleted' => true];
    }
    throw new HttpError(404, 'Not found.');
}
