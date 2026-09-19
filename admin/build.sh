#!/usr/bin/env bash
# Builds the deployable dashboard into admin/dist (static front end + PHP API).
# config.php is NOT copied: it holds the database password and is uploaded separately.
set -euo pipefail
cd "$(dirname "$0")"
(cd web && npx tsc -p tsconfig.app.json --noEmit && npx vite build)
rm -rf dist/api
mkdir -p dist/api/src
cp api/index.php api/schema.sql api/.htaccess dist/api/
cp api/src/*.php dist/api/src/
echo "Built admin/dist"
