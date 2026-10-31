<?php
// Database install and upgrades. The live database is upgraded in place on the
// first request after a deploy; every step is safe to run twice.

declare(strict_types=1);

const SCHEMA_VERSION = 2;

function ensure_installed(): void
{
    // One cheap indexed read per request; the full check only runs when behind.
    try {
        $v = scalar("SELECT v FROM settings WHERE k = 'schema_version'");
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? 0) !== 1146) { // 1146: table doesn't exist
            throw $e;
        }
        install_base();
        $v = null;
    }
    // Databases from before versioning are version 1.
    if ((int) ($v ?? 1) >= SCHEMA_VERSION) {
        return;
    }

    // Two requests arriving together must not both migrate.
    scalar("SELECT GET_LOCK('tk_migrate', 15)");
    try {
        $v = (int) (scalar("SELECT v FROM settings WHERE k = 'schema_version'") ?? 1);
        for ($n = $v + 1; $n <= SCHEMA_VERSION; $n++) {
            ('migrate_' . $n)();
            q("INSERT INTO settings (k, v) VALUES ('schema_version', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)", [(string) $n]);
        }
    } finally {
        scalar("SELECT RELEASE_LOCK('tk_migrate')");
    }
}

function install_base(): void
{
    $sql = file_get_contents(__DIR__ . '/../schema.sql');
    // Strip comments, then run statement by statement.
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
        db()->exec($stmt);
    }
    seed_master_data();
}

/** Website content (drafts, published revisions, photos) and visitor analytics. */
function migrate_2(): void
{
    $tables = [
        "CREATE TABLE IF NOT EXISTS cms_revisions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            data MEDIUMTEXT NOT NULL,
            note VARCHAR(255) NULL,
            created_at DATETIME NOT NULL,
            created_by INT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        // A single shared draft that every editor works on.
        "CREATE TABLE IF NOT EXISTS cms_draft (
            id TINYINT PRIMARY KEY,
            data MEDIUMTEXT NULL,
            base_revision INT NULL,
            updated_at DATETIME NULL,
            updated_by INT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS cms_media (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(190) NOT NULL,
            alt VARCHAR(255) NOT NULL DEFAULT '',
            path VARCHAR(190) NOT NULL,
            ext VARCHAR(5) NOT NULL,
            widths VARCHAR(60) NOT NULL,
            width INT NOT NULL,
            height INT NOT NULL,
            bytes INT NOT NULL,
            created_at DATETIME NOT NULL,
            created_by INT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        // One row per page view. No IP address is ever stored.
        "CREATE TABLE IF NOT EXISTS analytics_views (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            pv CHAR(16) NOT NULL,
            at DATETIME NOT NULL,
            day DATE NOT NULL,
            last_seen DATETIME NOT NULL,
            visitor CHAR(16) NOT NULL,
            path VARCHAR(255) NOT NULL,
            ref_host VARCHAR(120) NULL,
            utm_source VARCHAR(80) NULL,
            utm_medium VARCHAR(80) NULL,
            utm_campaign VARCHAR(120) NULL,
            device VARCHAR(10) NOT NULL,
            browser VARCHAR(30) NOT NULL,
            os VARCHAR(30) NOT NULL,
            country CHAR(2) NULL,
            lang VARCHAR(12) NULL,
            engaged INT NOT NULL DEFAULT 0,
            depth TINYINT UNSIGNED NOT NULL DEFAULT 0,
            UNIQUE KEY uq_pv (pv),
            INDEX ix_day (day),
            INDEX ix_visitor (visitor, at),
            INDEX ix_seen (last_seen)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS analytics_events (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            at DATETIME NOT NULL,
            day DATE NOT NULL,
            visitor CHAR(16) NOT NULL,
            pv CHAR(16) NULL,
            name VARCHAR(40) NOT NULL,
            label VARCHAR(120) NOT NULL DEFAULT '',
            path VARCHAR(255) NOT NULL DEFAULT '',
            INDEX ix_day_name (day, name),
            INDEX ix_visitor (visitor)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    ];
    foreach ($tables as $sql) {
        db()->exec($sql);
    }
    q('INSERT IGNORE INTO cms_draft (id) VALUES (1)');
    ensure_storage();
}
