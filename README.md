# 字图 · Hanzi Graph — Stage 1

A personal knowledge graph for Chinese characters, built with React + React Flow.

---

## Quick start

```bash
cd hanzi-graph
npm install
npm run dev
```

Then open http://localhost:5173

---

## What's in Stage 1

- **Interactive graph canvas** — drag, pan, zoom, minimap
- **Two node types** — dark nodes for radicals/primitives, light for compounds
- **Two edge types** — solid lines for component relationships, dashed for semantic
- **Detail panel** — slides open on node click with pinyin, meaning, components, notes
- **Add character modal** — auto-fills from a small built-in dictionary (30 characters); you write your own note and draw relationships yourself
- **Audio pronunciation** — uses the browser's built-in speech synthesis (Web Speech API), no API key needed
- **localStorage persistence** — your graph is saved between sessions automatically
- **Reset to seed** — restores the example characters (日月明木林森光) if you want a clean slate

---

## Project structure

```
src/
├── App.jsx                  ← Main layout + React Flow canvas
├── main.jsx                 ← Entry point
│
├── data/
│   └── seedData.js          ← Starting characters + relationships
│                              Edit this to change the defaults
│
├── hooks/
│   └── useGraphStore.js     ← All state + localStorage persistence (Zustand)
│                              This is the single source of truth
│
├── components/
│   ├── HanziNode.jsx        ← Custom node rendered on the canvas
│   ├── HanziEdges.jsx       ← ComponentEdge (solid) + SemanticEdge (dashed)
│   ├── DetailPanel.jsx      ← Right-hand side panel
│   └── AddCharacterModal.jsx ← Add character dialog with auto-fill
│
└── styles/
    └── app.css              ← All styles — design tokens at the top as CSS vars
```

---

## Customising the design

All visual tokens live at the top of `src/styles/app.css`:

```css
:root {
  --bg:              #F5F3EE;   /* canvas background */
  --surface:         #FFFFFF;   /* panel / node background */
  --node-radical-bg: #2C2C2A;   /* dark fill for radical nodes */
  --edge-color:      #A8A5A0;   /* colour of all edges */
  --font-serif:      'Noto Serif SC', serif;
  /* ... */
}
```

Change these and the whole app updates — no hunting through component files.

---

## Adding characters beyond the built-in 30

The auto-fill dictionary in `AddCharacterModal.jsx` has 30 common characters.
In Stage 2 this will be replaced with a full CC-CEDICT lookup (~100k entries).
For now you can also just type the character and fill the fields manually —
the act of doing it yourself is part of learning.

---

## Stage 2 roadmap

- [ ] Full CC-CEDICT dictionary integration (offline, no API key)
- [ ] Hanzi Writer stroke order animation + practice mode
- [ ] Pinyin-to-character input (type "ming" → pick 明)
- [ ] Floating node context menu (right-click to connect, delete, annotate)
- [ ] Edge label editing (click an edge to rename it)
- [ ] Graph search / filter by radical or semantic cluster
- [ ] Supabase sync for multi-device use

---

## Dependencies

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `reactflow` | Graph canvas |
| `zustand` | State management + localStorage |
| `vite` | Dev server + build |
