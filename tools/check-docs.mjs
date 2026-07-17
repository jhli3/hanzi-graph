// Gate: document structure
// Run: node tools/check-docs.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const fail = (msg) => { console.error(`✗ ${msg}`); failures++; };
const ok = (msg) => console.log(`✓ ${msg}`);

const require_ = (file, sections) => {
  const text = readFileSync(join(root, file), 'utf8');
  for (const s of sections) if (!text.includes(s)) fail(`${file}: missing required section "${s}"`);
};

require_('docs/PRD.md', ['## Vision', '## v1 Scope', '## Non-goals', '## Open questions', '## Success criteria']);
require_('docs/BACKLOG.md', ['## Autonomy legend', '## Worker protocol', '## Worker notes', '🟢', '🟡', '🔴']);
require_('CLAUDE.md', ['## Design tokens', '## Verification']);

if (!failures) ok('PRD.md, BACKLOG.md, CLAUDE.md structure valid');
process.exit(failures ? 1 : 0);
