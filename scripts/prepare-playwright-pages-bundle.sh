#!/usr/bin/env bash
set -euo pipefail

# Copies the HTML report and test-results into a bundle for GitHub Pages.
# Playwright keeps traces in test-results/ and references them from the report.

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
cp -R "$WEB_DIR/test-results" "$BUNDLE_DIR/"

echo "Prepared Playwright Pages bundle at ${BUNDLE_DIR}"
