<?php
// Local only: `php -S 127.0.0.1:8081 dev-router.php` mimics the Apache rewrite.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($path, '/api/')) {
    $_GET['r'] = substr($path, 5);
    require __DIR__ . '/index.php';
    return true;
}
return false;
