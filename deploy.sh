#!/usr/bin/env bash
# Uploads the website and/or the dashboard to the Cloud4Host server over FTPS.
#
#   ./deploy.sh site     # thandakapda.co        (FTP login locked to /www/thandakapda.co)
#   ./deploy.sh admin    # admin.thandakapda.co  (FTP login locked to /www/admin.thandakapda.co)
#   ./deploy.sh all
#
# Needs (all git-ignored):
#   .deploy/site.netrc, .deploy/admin.netrc   FTP logins (netrc format)
#   admin/api/config.production.php           database details, uploaded as api/config.php
set -euo pipefail
cd "$(dirname "$0")"

FTP_HOST="${FTP_HOST:-ftps8.uk.cloudlogin.co}"

upload_dir() { # <local dir> <netrc>
  local src="$1" netrc="$2" n=0
  while IFS= read -r -d '' f; do
    rel="${f#"$src"/}"
    curl -sS --ssl-reqd --ftp-create-dirs --retry 3 --netrc-file "$netrc" \
      -T "$f" "ftp://$FTP_HOST/$rel" >/dev/null
    n=$((n + 1))
  done < <(find "$src" -type f -print0)
  echo "  uploaded $n files"
}

deploy_site() {
  echo "Building website…"
  npm run build >/dev/null
  echo "Uploading website…"
  upload_dir out .deploy/site.netrc
}

deploy_admin() {
  [[ -f admin/api/config.production.php ]] || { echo "Missing admin/api/config.production.php"; exit 1; }
  echo "Building dashboard…"
  ./admin/build.sh >/dev/null
  echo "Uploading dashboard…"
  upload_dir admin/dist .deploy/admin.netrc
  curl -sS --ssl-reqd --netrc-file .deploy/admin.netrc -T admin/api/config.production.php "ftp://$FTP_HOST/api/config.php" >/dev/null
  echo "  uploaded api/config.php"
}

case "${1:-}" in
  site) deploy_site ;;
  admin) deploy_admin ;;
  all) deploy_site; deploy_admin ;;
  *) echo "Usage: ./deploy.sh site|admin|all"; exit 1 ;;
esac
echo "Done."
