// Gate: graph data integrity (seed data + dictionary)
// Run: node tools/check-graph-data.mjs
// Fails loudly on any structural violation. See BACKLOG.md worker protocol.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (msg) => { console.error(`✗ ${msg}`); process.exitCode = 1; };
const ok = (msg) => console.log(`✓ ${msg}`);

// ── Seed data ────────────────────────────────────────────────────────────────
const { SEED_NODES, SEED_EDGES } = await import(join(root, 'src/data/seedData.js'));

const nodeIds = new Set();
for (const n of SEED_NODES) {
  if (nodeIds.has(n.id)) fail(`duplicate node id: ${n.id}`);
  nodeIds.add(n.id);
  const d = n.data ?? {};
  if (!d.char || typeof d.char !== 'string') fail(`node ${n.id}: missing char`);
  if (!d.pinyin) fail(`node ${n.id}: missing pinyin`);
  if (typeof d.isRadical !== 'boolean') fail(`node ${n.id}: isRadical must be boolean`);
  if (typeof d.strokes !== 'number' || Number.isNaN(d.strokes)) fail(`node ${n.id}: strokes must be a number`);
  if (!n.position || Number.isNaN(n.position.x) || Number.isNaN(n.position.y))
    fail(`node ${n.id}: position must be numeric x/y`);
}
ok(`${SEED_NODES.length} seed nodes structurally valid`);

const EDGE_TYPES = new Set(['component', 'semantic']);
const edgeIds = new Set();
for (const e of SEED_EDGES) {
  if (edgeIds.has(e.id)) fail(`duplicate edge id: ${e.id}`);
  edgeIds.add(e.id);
  if (!nodeIds.has(e.source)) fail(`edge ${e.id}: unknown source ${e.source}`);
  if (!nodeIds.has(e.target)) fail(`edge ${e.id}: unknown target ${e.target}`);
  if (e.source === e.target) fail(`edge ${e.id}: self-loop`);
  if (!EDGE_TYPES.has(e.type)) fail(`edge ${e.id}: type must be component|semantic, got "${e.type}"`);
  if (typeof e.label !== 'string') fail(`edge ${e.id}: label must be a string (may be empty)`);
}
ok(`${SEED_EDGES.length} seed edges structurally valid`);

// ── Dictionary ───────────────────────────────────────────────────────────────
const cedictPath = join(root, 'public/cedict.json');
if (!existsSync(cedictPath)) {
  fail('public/cedict.json missing — run: node scripts/parse-cedict.mjs');
} else {
  let dict;
  try { dict = JSON.parse(readFileSync(cedictPath, 'utf8')); }
  catch { fail('public/cedict.json is not valid JSON'); }
  if (dict) {
    const entries = Array.isArray(dict) ? dict.length : Object.keys(dict).length;
    if (entries < 5000) fail(`cedict.json suspiciously small: ${entries} entries`);
    const raw = readFileSync(cedictPath, 'utf8');
    for (const char of ['明', '日', '月', '鱼']) {
      if (!raw.includes(char)) fail(`cedict.json missing expected character: ${char}`);
    }
    if (!process.exitCode) ok(`cedict.json valid (${entries} entries, spot checks pass)`);
  }
}

process.exit(process.exitCode ?? 0);
