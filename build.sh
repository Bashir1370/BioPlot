#!/usr/bin/env bash
set -euo pipefail
rm -rf dist

if [ -f package.json ]; then
  npm install
  npm run build
  cp app.js dist/app.js
  cp styles.css dist/styles.css
else
  mkdir -p dist
  for file in index.html dashboard.css dashboard.js editor.html styles.css app.js; do
    if [ -f "$file" ]; then cp "$file" dist/; fi
  done
fi
