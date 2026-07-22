// ─── Seed characters ────────────────────────────────────────────────────────
// Each character node stored in localStorage under key "hanzi-graph-nodes"
// isRadical: true means it's a building-block primitive — surfaced as the
// "radical" badge in the detail panel and the checkbox in the add-character
// modal. Node fill/text color is driven separately, by graph depth (see
// src/utils/nodeDepth.js), not by this field.

export const SEED_NODES = [
  {
    id: 'ri',
    position: { x: 120, y: 160 },
    data: {
      char: '日',
      pinyin: 'rì',
      tone: 4,
      meaning: 'sun, day',
      isRadical: true,
      strokes: 4,
      note: '',
    },
  },
  {
    id: 'yue',
    position: { x: 120, y: 320 },
    data: {
      char: '月',
      pinyin: 'yuè',
      tone: 4,
      meaning: 'moon, month',
      isRadical: true,
      strokes: 4,
      note: '',
    },
  },
  {
    id: 'ming',
    position: { x: 320, y: 240 },
    data: {
      char: '明',
      pinyin: 'míng',
      tone: 2,
      meaning: 'bright, clear, luminous',
      isRadical: false,
      strokes: 8,
      note: 'The two brightest objects in the sky — sun and moon — combine to form brightness itself.',
    },
  },
  {
    id: 'mu',
    position: { x: 520, y: 100 },
    data: {
      char: '木',
      pinyin: 'mù',
      tone: 4,
      meaning: 'tree, wood',
      isRadical: true,
      strokes: 4,
      note: '',
    },
  },
  {
    id: 'lin',
    position: { x: 520, y: 270 },
    data: {
      char: '林',
      pinyin: 'lín',
      tone: 2,
      meaning: 'grove, forest',
      isRadical: false,
      strokes: 8,
      note: 'Two trees side by side — a small forest, a grove.',
    },
  },
  {
    id: 'sen',
    position: { x: 520, y: 430 },
    data: {
      char: '森',
      pinyin: 'sēn',
      tone: 1,
      meaning: 'dense forest',
      isRadical: false,
      strokes: 12,
      note: 'Three trees — abundance, density, an ancient forest.',
    },
  },
  {
    id: 'guang',
    position: { x: 340, y: 430 },
    data: {
      char: '光',
      pinyin: 'guāng',
      tone: 1,
      meaning: 'light, ray, glory',
      isRadical: false,
      strokes: 6,
      note: '',
    },
  },
];

// ─── Seed edges ──────────────────────────────────────────────────────────────
// type: 'component' | 'semantic'
// label: optional short annotation

export const SEED_EDGES = [
  { id: 'e-ri-ming',    source: 'ri',   target: 'ming',  type: 'component', label: 'part' },
  { id: 'e-yue-ming',   source: 'yue',  target: 'ming',  type: 'component', label: 'part' },
  { id: 'e-mu-lin',     source: 'mu',   target: 'lin',   type: 'component', label: '×2'   },
  { id: 'e-mu-sen',     source: 'mu',   target: 'sen',   type: 'component', label: '×3'   },
  { id: 'e-lin-sen',    source: 'lin',  target: 'sen',   type: 'semantic',  label: ''     },
  { id: 'e-ming-guang', source: 'ming', target: 'guang', type: 'semantic',  label: 'bright' },
];
