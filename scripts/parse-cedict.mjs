// scripts/parse-cedict.mjs
//
// Run once to generate public/cedict.json from the raw CC-CEDICT file.
//
// Usage:
//   1. Download CC-CEDICT from https://www.mdbg.net/chinese/dictionary?page=cc-cedict
//   2. Unzip — you'll get a file called cedict_ts.u8
//   3. Drop it in the project root
//   4. Run: node scripts/parse-cedict.mjs
//   5. public/cedict.json will be created (~8MB)
//      The app lazy-loads this only when the Add Character modal opens.
//
// Output format — keyed by simplified character for O(1) lookup:
// {
//   "明": {
//     "simplified":  "明",
//     "traditional": "明",
//     "pinyin":      "ming2",         // CC-CEDICT numeric tone format
//     "pinyinTone":  "míng",          // converted to diacritic form
//     "tone":        2,               // 1–4 (0 = neutral)
//     "meanings":    ["bright", "clear", "to understand"]
//   },
//   ...
// }

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT     = path.join(__dirname, '..', 'cedict_ts.u8');
const OUTPUT    = path.join(__dirname, '..', 'public', 'cedict.json');

// ─── Tone diacritic conversion ────────────────────────────────────────────────
const TONE_MAP = {
  a: ['ā','á','ǎ','à','a'],
  e: ['ē','é','ě','è','e'],
  i: ['ī','í','ǐ','ì','i'],
  o: ['ō','ó','ǒ','ò','o'],
  u: ['ū','ú','ǔ','ù','u'],
  ü: ['ǖ','ǘ','ǚ','ǜ','ü'],
};

// Vowel priority for tone placement (standard rules)
const PRIORITY = ['a','e','ou','i','u','ü'];

function numericToTone(syllable) {
  const toneNum = parseInt(syllable.slice(-1));
  if (isNaN(toneNum)) return syllable;
  const base = syllable.slice(0, -1).replace('v', 'ü').replace('u:', 'ü');
  if (toneNum === 5 || toneNum === 0) return base;

  for (const seq of PRIORITY) {
    for (const ch of seq) {
      if (base.includes(ch) && TONE_MAP[ch]) {
        return base.replace(ch, TONE_MAP[ch][toneNum - 1]);
      }
    }
  }
  return base;
}

function convertPinyin(raw) {
  // raw example: "ming2 bai2"
  return raw
    .split(' ')
    .map(s => numericToTone(s.toLowerCase()))
    .join('');
}

function extractTone(raw) {
  // Take tone of first syllable
  const first = raw.split(' ')[0];
  const t = parseInt(first.slice(-1));
  return isNaN(t) || t === 5 ? 0 : t;
}

// ─── Parse ────────────────────────────────────────────────────────────────────
function parse(inputPath) {
  const text    = fs.readFileSync(inputPath, 'utf8');
  const lines   = text.split('\n');
  const result  = {};
  let   count   = 0;

  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;

    // CC-CEDICT line format:
    // Traditional Simplified [pin1 yin1] /meaning1/meaning2/
    const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
    if (!match) continue;

    const [, traditional, simplified, pinyinRaw, definitionsRaw] = match;
    const meanings = definitionsRaw.split('/').map(s => s.trim()).filter(Boolean);

    // Skip proper nouns (start with capital in definitions), surenames and variant entries
    if (
      meanings[0]?.match(/^variant/)  ||
      meanings[0]?.match(/^surname/)  ||
      meanings[0]?.match(/^name of/)
    ) continue;

    const entry = {
      simplified,
      traditional,
      pinyin:    pinyinRaw,
      pinyinTone: convertPinyin(pinyinRaw),
      tone:      extractTone(pinyinRaw),
      meanings,
    };

    // Single-character entries always win over compounds.
    // For single chars, also keep the shortest/most common reading
    // (CC-CEDICT lists most common first, so only overwrite if upgrading
    // from a multi-char entry to a single-char one).
    const existing = result[simplified];
    if (!existing) {
      result[simplified] = entry;
      count++;
    } else {
      const incomingIsSingleChar = [...simplified].length === 1;
      const existingIsSurname    = existing.meanings[0]?.match(/^surname|^name of/);
      const incomingRicher       = entry.meanings.length > existing.meanings.length;

      if (existingIsSurname || (incomingIsSingleChar && incomingRicher)) {
        result[simplified] = entry;
      }
    }
  }

  return { result, count };
}

// ─── Run ──────────────────────────────────────────────────────────────────────
if (!fs.existsSync(INPUT)) {
  console.error(`\n❌  Input file not found: ${INPUT}`);
  console.error('    Download cedict_ts.u8 from https://www.mdbg.net/chinese/dictionary?page=cc-cedict\n');
  process.exit(1);
}

fs.mkdirSync(path.join(__dirname, '..', 'public'), { recursive: true });

console.log('Parsing CC-CEDICT…');
const { result, count } = parse(INPUT);
fs.writeFileSync(OUTPUT, JSON.stringify(result));

const kb = Math.round(fs.statSync(OUTPUT).size / 1024);
console.log(`✓  ${count.toLocaleString()} entries → public/cedict.json (${kb} KB)`);
