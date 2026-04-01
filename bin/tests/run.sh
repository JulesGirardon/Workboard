#!/usr/bin/env bash
set -euo pipefail

# Run unit + integration tests with coverage.
# Usage: bin/tests/run.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

export NODE_ENV=test

# Install deps if needed (optional)
install_deps() {
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
}

if [ ! -d node_modules ]; then
  install_deps
else
  # If a previous install was interrupted, node_modules can exist but be corrupt.
  # Quick sanity check: this dependency is required by Jest's coverage stack.
  if ! node -e "require('baseline-browser-mapping')" >/dev/null 2>&1; then
    echo "Detected corrupted node_modules; reinstalling dependencies..." >&2
    rm -rf node_modules
    install_deps
  fi
fi

npx jest --runInBand --coverage
