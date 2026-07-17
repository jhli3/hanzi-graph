# PRD — 字图 · Hanzi Graph v1

**Version:** 1.0 · **Date:** 2026-07-17 · **Status:** Active
**Owner:** Jen Li

---

## Vision

A personal knowledge graph for exploring Chinese characters through their logographic structure and semantic relationships — built for someone who understands spoken Chinese but doesn't read or write it. The graph *is* the interface: dark nodes are building blocks, light nodes are derived characters, and the edges carry the learning.

v1 "done" means two things at once:

1. **A stable daily-use tool** for Jen — reliable enough to build a real graph in over months.
2. **A portfolio-grade artifact** — deployed, explorable by strangers, and legible as a design story without Jen in the room.

The aesthetic is intentional and load-bearing: ink-and-paper, scholarly, quiet. Not a language-learning app.

---

## Users

| User | Needs |
|---|---|
| Jen (primary) | Add characters via pinyin, hear pronunciation, annotate in her own words, see structural + semantic relationships grow over time |
| Portfolio visitor (secondary) | Land on a deployed demo with a curated graph, understand what they're looking at within ~30 seconds, explore without instructions |

---

## What already exists (v0.9)

Working and verified in the repo — the PRD builds on, not toward, these:

- React Flow canvas with custom nodes (radical/compound variants) and edges (component/semantic)
- Two-stage add-character flow with CC-CEDICT auto-fill (pinyin normalization, surname-entry filtering)
- Detail panel: components, personal note, audio (Web Speech API), related characters
- **Stroke order animation** via Hanzi Writer (`StrokeOrderWriter.jsx`) — already built, contrary to the stale CLAUDE.md backlog
- d3-force physics with pinning, off by default
- localStorage persistence with seed-data reset

---

## Non-goals (explicitly cut from v1)

| Cut | Rationale |
|---|---|
| Etymology trails | Art project with unbounded per-character cost. Prototypes preserved (`etymology-*.html`) — may return post-v1. |
| Character scene animations | Same: per-character illustration cost doesn't converge. Aesthetic reference stays in CLAUDE.md. |
| Supabase sync / multi-device | Demo story doesn't need a backend; localStorage is sufficient for one person + one deployed demo. |
| Shareable read-only graph URLs | Superseded by the deployed demo with curated seed graph. |
| Semantic field colouring | Not selected for v1 scope. |

Cutting these is what makes v1 finishable. They're parked, not deleted.

---

## v1 Scope

### 1. Canvas ergonomics

- **Edge label editing** — click an edge to name/rename the relationship (e.g. "both mean bright"). Labels render in `--font-body` italic along the edge.
- **Node context menu** — right-click a node: delete, toggle radical status, pin/release (physics), edit note. Replaces hunting through the detail panel for destructive actions.

*Acceptance:* every graph mutation is reachable from the canvas without opening a modal, except add-character.

### 2. Search & filter

- Search box (toolbar) matching character, pinyin, or meaning; matching nodes highlight, non-matches dim.
- Filter by structural role (radicals only) and by connectivity (e.g. "show 明 and everything it touches").

*Acceptance:* useful at 100+ nodes — a graph too big to eyeball is still navigable.

### 3. Stroke practice mode

- Extend `StrokeOrderWriter.jsx` with Hanzi Writer's built-in quiz mode: trace strokes with mouse/finger, mistakes shake and re-hint.
- Toggle between "watch" and "practice" in the detail panel.

*Acceptance:* Jen can practice writing any character in her graph without leaving the app.

### 4. Demo-ready deployment

- **Curated seed graph** (~25–35 characters): 3–4 meaningful clusters showing off both edge types, replacing the current 7-character seed. This is content design, not code.
- **First-visit onboarding** — one dismissible hint layer explaining dark vs. light nodes and solid vs. dashed edges. Nothing more.
- **cedict.json diet** — currently **21.7 MB**; must be trimmed (single-character + needed fields only) before deploy is viable.
- Static deploy (Vercel or Netlify). Visitors fork the seed graph into their own localStorage — explorable, no backend.
- README rewritten for a public audience with screenshots.

*Acceptance:* a stranger with a link can explore, add a character, and hear it pronounced — with zero explanation from Jen.

---

## Prototype track (explore before committing)

Not in v1 scope. Each gets a time-boxed prototype first; graduates to the backlog only if the prototype earns it.

- **Compound discovery** — surface common compounds when a character is added. Open questions: suggest-on-add vs. dedicated explorer; how compounds render as nodes (multi-char nodes break the 80×80 grid?).
- **Spaced repetition surfacing** — last-visited timestamp per node + subtle stale-node visual. Open question: does any review pressure, however soft, fight the exploratory spirit of the tool?

---

## Success criteria

1. Jen uses it weekly, unprompted, after v1 ships.
2. The deployed demo survives a stranger test: someone unfamiliar explores for 2+ minutes and can explain dark vs. light nodes afterward.
3. Zero data-loss bugs in localStorage persistence.
4. Deployed bundle loads the canvas in under 3 seconds on a normal connection (the cedict diet is most of this).

---

## Open questions

- Curated seed graph content: which clusters? (Candidates: 日/月/明/光 light-cluster, 木/林/森 tree-cluster, 水-family, 人-family.) Needs Jen's judgment — it's the demo's narrative.
- Does the demo need a "reset to seed" affordance more prominent than the current sidebar button?
- Where do the etymology prototypes live long-term — a `/prototypes` folder, or logged to the creative coding library and removed?
