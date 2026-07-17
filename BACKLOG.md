# BACKLOG — 字图 · Hanzi Graph v1

Ordered by milestone. Work top to bottom; each milestone is independently shippable.
Effort: **S** ≤ 1 session · **M** 1–2 sessions · **L** 3+ sessions.

---

## M0 — Housekeeping (do first, it's quick)

- [ ] **S** Update CLAUDE.md: move stroke order from backlog to "Key behaviours"; replace Stage 2 backlog section with a pointer to this file and PRD.md
- [ ] **S** Move `etymology-*.html` prototypes into `/prototypes` folder (decision pending in PRD open questions — default to moving, not deleting)
- [ ] **S** Fix dictionary git setup — currently backwards for deploy: raw `cedict_ts.u8` (20+ MB) **is committed** while generated `public/cedict.json` is gitignored, so a git-based Vercel deploy would ship the raw file and lack the JSON the app needs. Flip it: untrack the .u8, commit the (post-diet) json — or run `parse-cedict.mjs` as a build step

## M1 — Canvas ergonomics

- [ ] **S** Edge label editing — UI only: `useGraphStore.updateEdgeLabel()` and `data.label` already exist (verified). Add click-to-edit inline input on `ComponentEdge`/`SemanticEdge`, render in `--font-body` italic
- [ ] **M** Node context menu: right-click → delete / toggle radical / pin-release / edit note. New component; wire into React Flow's `onNodeContextMenu`
- [ ] **S** Confirm-on-delete for nodes with edges (orphan-edge cleanup verified present in `deleteNode` — just add the confirm dialog)

## M2 — Search & filter

- [ ] **M** Toolbar search input: match character, pinyin (normalized, reuse `useCedict` normalizer), or note text; highlight matches, dim rest
- [ ] **S** Filter toggles: radicals-only view; clear-filter state
- [ ] **M** Neighborhood focus: select node + modifier → dim everything outside its connected subgraph

## M3 — Stroke practice

- [ ] **M** Practice mode in `StrokeOrderWriter.jsx` via Hanzi Writer `quiz()` API; watch/practice toggle in detail panel
- [ ] **S** Missing-character fallback: error state verified present in `StrokeOrderWriter.jsx`; confirm it also covers quiz mode

## M4 — Demo-ready deployment

- [ ] **M** cedict.json diet: modify `parse-cedict.mjs` to emit single-character entries + minimal fields only; target < 2 MB (currently 21.7 MB). Measure before/after
- [ ] **L** Curated seed graph: 25–35 characters, 3–4 clusters, both edge types represented. Content design — Jen picks the clusters (PRD open question)
- [ ] **M** First-visit onboarding hint: one dismissible layer, localStorage flag, explains node/edge encoding
- [ ] **S** Prominent "reset to seed" affordance decision + implementation
- [ ] **M** Public README: what it is, why it looks like this, screenshots, run instructions
- [ ] **S** Deploy to Vercel/Netlify; verify Web Speech API + hanzi-writer CDN work in prod; check load < 3 s
- [ ] **S** Stranger test: one person, no coaching, 2 minutes — note where they stall

## Prototype track (unscheduled — time-boxed explorations)

- [ ] Compound discovery prototype: suggest-on-add UI sketch + answer "how does a multi-char compound render as a node?"
- [ ] SRS surfacing prototype: stale-node visual treatment options on the ink aesthetic; decide if it fights the exploratory feel

## Parked (post-v1, not deleted)

- Etymology trails (prototypes in repo)
- Character scene animations
- Semantic field colouring
- Supabase sync / shareable URLs
