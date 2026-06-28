#!/usr/bin/env bash
set -euo pipefail

# Copies the HTML report into a bundle for GitHub Pages (failures only in CI).
# Traces and videos stay in GitHub Actions artifacts — not published to Pages.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT/src/web"
BUNDLE_DIR="$WEB_DIR/playwright-pages-bundle"

if [ ! -d "$WEB_DIR/playwright-report" ]; then
  echo "playwright-report directory not found at ${WEB_DIR}/playwright-report" >&2
  exit 1
fi

rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR"
cp -R "$WEB_DIR/playwright-report" "$BUNDLE_DIR/"

echo "Prepared Playwright Pages bundle at ${BUNDLE_DIR}"
