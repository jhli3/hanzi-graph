// Gate: authored-state guard
// Human-authored values must not change silently: design tokens (app.css :root)
// and seed data (seedData.js). Additions allowed; changes/removals fail unless
// BAKE=1 is set (used only for commits whose stated purpose is baking Jen's
// own tuned/authored state).
// Run: node tools/check-authored-state.mjs

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BAKE = process.env.BAKE === '1';
let failures = 0;
const violation = (msg) => {
  if (BAKE) { console.warn(`⚠ (BAKE=1, allowed) ${msg}`); }
  else { console.error(`✗ ${msg}`); failures++; }
};
const ok = (msg) => console.log(`✓ ${msg}`);

const headContent = (path) => {
  try { return execSync(`git show HEAD:${path}`, { cwd: root, encoding: 'utf8' }); }
  catch { return null; } // new file — nothing to guard yet
};

// ── Design tokens ────────────────────────────────────────────────────────────
const parseTokens = (css) => {
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  const tokens = {};
  for (const m of rootBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
};

const cssPath = 'src/styles/app.css';
const headCss = headContent(cssPath);
if (headCss !== null) {
  const before = parseTokens(headCss);
  const after = parseTokens(readFileSync(join(root, cssPath), 'utf8'));
  if (Object.keys(before).length === 0) violation('no :root tokens found at HEAD — guard marker missing?');
  for (const [k, v] of Object.entries(before)) {
    if (!(k in after)) violation(`design token removed: --${k}`);
    else if (after[k] !== v) violation(`design token changed: --${k}: "${v}" → "${after[k]}"`);
  }
  if (!failures) ok(`${Object.keys(before).length} design tokens unchanged (additions: ${Object.keys(after).length - Object.keys(before).length})`);
}

// ── Seed data ────────────────────────────────────────────────────────────────
const seedPath = 'src/data/seedData.js';
const headSeed = headContent(seedPath);
if (headSeed !== null) {
  const tmp = join(tmpdir(), `head-seed-${Date.now()}.mjs`);
  writeFileSync(tmp, headSeed);
  const before = await import(tmp);
  try { rmSync(tmp); } catch { /* best effort */ }
  const after = await import(join(root, seedPath));

  const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
  for (const [name, key] of [['SEED_NODES', 'node'], ['SEED_EDGES', 'edge']]) {
    const b = byId(before[name]), a = byId(after[name]);
    for (const id of Object.keys(b)) {
      if (!(id in a)) violation(`seed ${key} removed: ${id}`);
      else if (JSON.stringify(b[id]) !== JSON.stringify(a[id]))
        violation(`seed ${key} changed: ${id} (exact-match rule — precision trimming counts)`);
    }
  }
  if (!failures) ok('seed data unchanged at HEAD-guarded ids');
}

process.exit(failures ? 1 : 0);
