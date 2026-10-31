#!/usr/bin/env bash
# Uploads the website and/or the dashboard to the Cloud4Host server over FTPS.
#
#   ./deploy.sh site     # thandakapda.co        (FTP login locked to /www/thandakapda.co)
#   ./deploy.sh admin    # admin.thandakapda.co  (FTP login locked to /www/admin.thandakapda.co)
#   ./deploy.sh all      # dashboard first, then the website
#
# Only files that changed since the last deploy are sent (hashes are kept in
# .deploy/<target>.manifest; delete it to force a full upload). Scripts,
# styles and images go up before the pages that use them, so nobody gets a
# half-deployed page.
#
# Needs (all git-ignored):
#   .deploy/site.netrc, .deploy/admin.netrc   FTP logins (netrc format)
#   admin/api/config.production.php           database details, uploaded as api/config.php
set -euo pipefail
cd "$(dirname "$0")"

FTP_HOST="${FTP_HOST:-ftps8.uk.cloudlogin.co}"
ADMIN_URL="${ADMIN_URL:-https://admin.thandakapda.co}"

put() { # <local file> <remote path> <netrc>
  curl -sS --ssl-reqd --ftp-create-dirs --retry 3 --netrc-file "$3" -T "$1" "ftp://$FTP_HOST/$2" >/dev/null
}

upload_dir() { # <local dir> <netrc> <manifest name>
  local src="$1" netrc="$2" manifest=".deploy/$3.manifest" next n=0 skipped=0
  next="$(mktemp)"
  touch "$manifest"
  # sha1sum marks files "*" in binary mode on Windows; normalise to "<hash>  <path>".
  (cd "$src" && find . -type f -print0 | xargs -0 sha1sum | sed -E 's#^([0-9a-f]+) [ *]\./#\1  #' | sort -k2) >"$next"
  # Pages and the files that point at everything else go last.
  local late='(\.html|\.txt|\.htaccess|index\.php)$'
  for pass in early late; do
    while read -r hash rel; do
      if [[ $pass == early && $rel =~ $late ]] || [[ $pass == late && ! $rel =~ $late ]]; then continue; fi
      if grep -qxF "$hash  $rel" "$manifest"; then
        skipped=$((skipped + 1))
        continue
      fi
      put "$src/$rel" "$rel" "$netrc"
      n=$((n + 1))
    done <"$next"
  done
  mv "$next" "$manifest"
  echo "  uploaded $n changed files ($skipped unchanged)"
}

deploy_site() {
  echo "Fetching the latest published website content…"
  # Bake it into the HTML so search engines and link previews see current words.
  if curl -fsS --max-time 20 "$ADMIN_URL/live/content.json" -o src/content/published.json.tmp \
    && node -e "const j=JSON.parse(require('fs').readFileSync('src/content/published.json.tmp','utf8')); if(typeof j.version!=='number') process.exit(1)"; then
    mv src/content/published.json.tmp src/content/published.json
    echo "  content version $(node -p "require('./src/content/published.json').version")"
  else
    rm -f src/content/published.json.tmp
    echo "  could not fetch it; building with the content already in src/content/published.json"
  fi
  echo "Checking the editor covers all content…"
  npx --yes jiti scripts/check-content-schema.ts
  echo "Building website…"
  npm run build >/dev/null
  echo "Uploading website…"
  upload_dir out .deploy/site.netrc site
}

deploy_admin() {
  [[ -f admin/api/config.production.php ]] || { echo "Missing admin/api/config.production.php"; exit 1; }
  echo "Building dashboard…"
  ./admin/build.sh >/dev/null
  echo "Uploading dashboard…"
  upload_dir admin/dist .deploy/admin.netrc admin
  put admin/api/config.production.php api/config.php .deploy/admin.netrc
  echo "  uploaded api/config.php"
  # The first request after a deploy upgrades the database; do it now, not on a visitor.
  echo "  health: $(curl -fsS --max-time 30 "$ADMIN_URL/api/public/health" || echo 'not reachable')"
}

case "${1:-}" in
  site) deploy_site ;;
  admin) deploy_admin ;;
  all) deploy_admin; deploy_site ;;
  *) echo "Usage: ./deploy.sh site|admin|all"; exit 1 ;;
esac
echo "Done."
