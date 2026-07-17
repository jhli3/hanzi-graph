#!/usr/bin/env bash
# One-command gate. Run from repo root: bash tools/check-all.sh
# Fast checks first, build last. Exits nonzero on any failure.
set -e
cd "$(dirname "$0")/.."

echo "── graph data ──────────────────────────"
node tools/check-graph-data.mjs
echo "── authored state ──────────────────────"
node tools/check-authored-state.mjs
echo "── docs ────────────────────────────────"
node tools/check-docs.mjs
echo "── build ───────────────────────────────"
# Build to a throwaway dir: the gate proves the app compiles; it does not
# produce deploy artifacts (plain `npm run build` does that, into dist/).
npm run build --silent -- --outDir "$(mktemp -d)/dist" --emptyOutDir
echo ""
echo "ALL GATES GREEN"
