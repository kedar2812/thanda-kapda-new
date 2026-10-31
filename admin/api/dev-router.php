<?php
// Local only: `php -S 127.0.0.1:8081 dev-router.php` mimics the Apache rewrite,
// and serves /live/ (published content and photos) from admin/live like the server does.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($path, '/api/')) {
    $_GET['r'] = substr($path, 5);
    require __DIR__ . '/index.php';
    return true;
}
if (str_starts_with($path, '/live/')) {
    $cfgFile = getenv('TK_CONFIG') ?: __DIR__ . '/config.php';
    $cfg = is_file($cfgFile) ? require $cfgFile : [];
    $root = realpath($cfg['live_dir'] ?? dirname(__DIR__) . '/live');
    $file = $root ? realpath($root . '/' . substr(rawurldecode($path), 6)) : false;
    header('Access-Control-Allow-Origin: *');
    if (!$file || !str_starts_with($file, $root) || !is_file($file)) {
        http_response_code(404);
        return true;
    }
    $types = ['json' => 'application/json', 'webp' => 'image/webp', 'jpg' => 'image/jpeg', 'png' => 'image/png'];
    header('Content-Type: ' . ($types[pathinfo($file, PATHINFO_EXTENSION)] ?? 'application/octet-stream'));
    header('Cache-Control: no-cache');
    readfile($file);
    return true;
}
return false;
