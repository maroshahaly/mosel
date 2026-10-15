#!/bin/sh
# © 2026 Maro Shahaly — موصل. ينشر النسخة المحمية إلى فرع deploy؛ وCloudflare Pages المربوط به ينشرها تلقائيًا.
#   sh tools/publish.sh
set -e
cd "$(dirname "$0")/.."
node tools/build_dist.mjs
TMP=$(mktemp -d); cp -r dist/. "$TMP"/
URL=$(git remote get-url origin)
cd "$TMP" && git init -q -b deploy && git add -A
git -c user.name="Mosel" -c user.email="mosel@users.noreply.github.com" commit -q -m "نشر $(head -1 VERSION.txt)"
git remote add origin "$URL" && git push -q -f origin deploy
echo "✔ نُشرت النسخة إلى فرع deploy"
