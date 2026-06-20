# 字图 · Hanzi Graph — Project Context

A personal knowledge graph for exploring Chinese characters through their logographic structure and semantic relationships. Built for someone who understands Chinese but doesn't read or write it — so the UI prioritises pinyin input, audio pronunciation, and visual/structural learning over text-based interaction.

---

## Core concept

Obsidian-style canvas where Chinese characters are nodes and relationships are edges. Two relationship types:
- **Component** (solid edge) — structural, e.g. 日 and 月 are components of 明
- **Semantic** (dashed edge) — meaning cluster, e.g. 明 and 光 both relate to light/brightness

Radicals and primitives render as **dark nodes** (near-black fill); compound characters render as **light nodes** (white). This visual distinction is load-bearing — it shows at a glance what's a building block vs. what's derived.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 + Vite | Entry point is `src/main.jsx` |
| Graph canvas | React Flow 11 | Custom node + edge types registered |
| State | Zustand | Single store, auto-persists to localStorage |
| Dictionary | CC-CEDICT | Parsed offline to `public/cedict.json` via `scripts/parse-cedict.mjs` |
| Node physics | d3-force | `useForceLayout` hook, off by default |
| Styling | Plain CSS | Design tokens as CSS vars at top of `src/styles/app.css` |
| Audio | Web Speech API | Browser-native, no API key, `lang: 'zh-CN'` |
| Fonts | Noto Serif SC · DM Mono · Fraunces | Loaded via Google Fonts in `index.html` |

---

## File map

```
src/
├── App.jsx                  ← Main layout, React Flow canvas, toolbar, physics toggle
├── main.jsx                 ← Entry point
│
├── data/
│   └── seedData.js          ← Starting characters (日月明木林森光) + edges
│
├── hooks/
│   ├── useGraphStore.js     ← All state: nodes, edges, selection, tool mode, localStorage
│   ├── useCedict.js         ← Lazy-loads cedict.json, exposes lookup() + searchByPinyin()
│   └── useForceLayout.js    ← d3-force simulation, pinning, drag handlers
│
├── components/
│   ├── HanziNode.jsx        ← Custom React Flow node (80×80px, radical/compound variants)
│   ├── HanziEdges.jsx       ← ComponentEdge (solid) + SemanticEdge (dashed)
│   ├── DetailPanel.jsx      ← Right panel: components, note, stroke count, audio, related
│   └── AddCharacterModal.jsx ← Two-stage: pinyin search → confirm + annotate
│
└── styles/
    └── app.css              ← All styles. Design tokens at the very top as CSS vars.

scripts/
└── parse-cedict.mjs         ← Run once: node scripts/parse-cedict.mjs
                                Reads cedict_ts.u8 → writes public/cedict.json
```

---

## Design tokens

All in `:root` at the top of `src/styles/app.css`. Key ones:

```css
--bg:              #F5F3EE;   /* warm off-white canvas */
--surface:         #FFFFFF;
--surface-muted:   #F1EFE8;
--text-primary:    #1E1E1C;
--node-radical-bg: #2C2C2A;   /* dark fill for radical nodes */
--node-radical-text: #F1EFE8;
--edge-color:      #A8A5A0;
--font-serif:      'Noto Serif SC', serif;   /* characters */
--font-mono:       'DM Mono', monospace;     /* UI chrome, pinyin */
--font-body:       'Fraunces', serif;        /* notes, italic text */
```

Changing tokens updates the whole app — no hunting through component files.

---

## Key behaviours

**Add character flow** (two-stage modal):
1. Type pinyin (e.g. `ming`, `yú`, `shuǐ`) → grid of matching characters appears
2. Click a character → form auto-fills from CC-CEDICT (pinyin, tone, first 3 meanings)
3. User writes their own note, optionally marks as radical, hits Add

**Dictionary auto-fill logic** (`useCedict.js`):
- Normalises pinyin by stripping diacritics + numeric tones (`míng` → `ming`, `yu2` → `yu`)
- Builds a reverse pinyin index keyed on first syllable only (avoids compounds shadowing single chars)
- Known issue history: CC-CEDICT lists surname entries before common entries for some chars (e.g. 鱼 was initially returning "surname Yu"). Fixed in `parse-cedict.mjs` by skipping entries whose first definition matches `/^surname|^name of|^variant/` and preferring the entry with the most meanings on conflict.

**Physics** (`useForceLayout.js`):
- Off by default — toggle in toolbar
- `forceManyBody` repels all nodes; `forceLink` attracts connected pairs
- Dragging a node pins it (`fx`/`fy` in d3 terms) — it stays where dropped
- Double-click a pinned node to release it back into the simulation
- `reheat()` fires automatically when nodes/edges are added/removed

**Persistence**: `localStorage` keys `hanzi-graph-nodes` and `hanzi-graph-edges`. Reset to seed data via sidebar button (with confirm dialog).

---

## CC-CEDICT setup (one-time)

1. Download `cedict_ts.u8` from https://www.mdbg.net/chinese/dictionary?page=cc-cedict
2. Drop in project root
3. `node scripts/parse-cedict.mjs` → generates `public/cedict.json`
4. Hard-refresh browser to bust cache after regenerating

The parse script skips: surname entries, "name of" entries, variants. On conflict for the same simplified character, it keeps the entry with the most meanings (most semantically rich).

---

## Planned / in-progress features

### Etymology trails (explored, not yet built)
Interactive scrubber showing how a character's visual form evolved: oracle bone → bronze script → seal script → modern. Two animation modes explored in prototype:
- **Morph** — crossfade between hand-drawn canvas renderings of each historical form
- **Particles** — origin form dissolves into ink particles, reforms as next stage

Data approach: manual for now (tracing historical forms as canvas paths is slow but is itself a learning exercise). Future: source actual oracle bone rubbings as reference images, or find an existing SVG glyph dataset. Would live in the detail panel or as a full-screen overlay — not yet decided.

### Character scene animations (explored, not yet built)
Ambient canvas illustrations that play when a character is selected — e.g. 鱼 shows an ink-style fish pond, 森 shows trees with falling leaves, 日 shows a sunrise. Aesthetic reference: Bao Thien's portfolio (baothiento.com) — warm off-white, organic ink mark-making, minimal color, things that feel alive but quiet. Would sit in the detail panel replacing the stroke count placeholder.

### Stage 2 backlog
- [ ] Full Hanzi Writer stroke order animation + practice mode
- [ ] Edge label editing (click an edge to rename it)
- [ ] Floating node context menu (right-click)
- [ ] Graph search / filter by radical or semantic cluster
- [ ] Compound word discovery (surface common compounds when a character is added)
- [ ] Spaced repetition surfacing (subtle indicator for unvisited characters)
- [ ] Semantic field colouring (tint nodes by meaning cluster)
- [ ] Supabase migration for multi-device sync
- [ ] Shareable read-only graph URLs

---

## Working preferences

- Provide **targeted code snippets** rather than full file re-scaffolds when modifying existing files
- When providing full file replacements, make it clear which file to replace
- The owner is a UI/UX designer with a CS background (Java, C++, Python, HTML/CSS, learning JS) — technical explanations can assume comfort with concepts but should be clear about JS-specific patterns
- Design decisions should be explained before implementation — especially when there are tradeoffs
- The aesthetic direction is intentional: ink-and-paper, scholarly, not a language-learning app
