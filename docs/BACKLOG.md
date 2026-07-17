# BACKLOG.md — 字图 Hanzi Graph work queue

Derived from PRD.md v1.0 (2026-07-17). Written for a less capable model to
execute with minimal supervision. **Read CLAUDE.md in full before any task —
it wins over this file when they conflict.**

## Autonomy legend

| Tag | Meaning |
|---|---|
| 🟢 AUTO | Do it alone. Machine-verifiable. Jen sees it at commit review, not before. |
| 🟡 TASTE | Build alone **behind tunable parameters with controls Jen can operate**, then stop and hand over. Done = her tuned state is baked back verbatim. |
| 🔴 DECIDE | A registered open decision (see Decision registry). Present options with tradeoffs, **wait for the pick**, then execute the pick as 🟢. Never decide unilaterally. |
| 🧪 PROTOTYPE (Jen) | Not for workers at all. Jen explores these herself via cheap prototypes; they enter this backlog only if the prototype earns it. |

## Decision registry (from PRD.md § Open questions)

| ID | Decision | Owner |
|---|---|---|
| D1 | Curated seed graph: which 3–4 character clusters, which characters | Jen |
| D2 | Reset-to-seed affordance: keep sidebar button or make prominent for demo visitors | Jen |
| D3 | Etymology prototypes: move to `/prototypes` or log to creative coding library and remove | Jen |
| D4 | v1.1 sync: backend (Supabase vs. alt), sign-in method, offline conflict model | Jen |

## Worker protocol (every task, no exceptions)

1. `git status` — start from a clean tree; stop and report if dirty.
2. Read the task's **Refs** before writing anything.
3. Implement, respecting CLAUDE.md conventions (targeted changes, design tokens only, ink-and-paper aesthetic).
4. **Run the task's Verify command(s). All must pass. Never commit red.**
5. If the task touches UI: run the browser smoke procedure in `tools/SMOKE.md`, exactly as written.
6. Commit as `BL-<id>: <summary>` — one task, one commit.
7. Blocked or uncertain → append a dated note under **Worker notes** below, commit that, and move to the next unblocked task. Do not improvise around a blocker.

**Standing rules for the unsupervised worker:**

- **Authored state:** design tokens (`:root` in `src/styles/app.css`) and seed data (`src/data/seedData.js`) are Jen's. The gate `tools/check-authored-state.mjs` fails on changes/removals; `BAKE=1` is permitted **only** for commits whose stated purpose is baking Jen's own authored values (e.g. BL-5.2).
- Never modify anything in `tools/` in the same commit as implementation changes.
- Never resolve a 🔴 item as a side effect of a 🟢 one.
- No new npm dependencies, no version bumps — either requires a 🔴.
- localStorage keys `hanzi-graph-nodes` / `hanzi-graph-edges` are frozen; a schema/key change requires a 🔴 (existing graphs must not be lost).
- `etymology-*.html` prototypes: read, never write.
- New UI must use existing CSS design tokens — no hex values in components.

---

## Phase 0 — Gates ✅ (built 2026-07-17, verified green)

- ✅ BL-0.1 `tools/check-graph-data.mjs` — seed node/edge invariants + cedict.json shape and spot checks
- ✅ BL-0.2 `tools/check-authored-state.mjs` — design-token + seed-data guard, BAKE=1 escape
- ✅ BL-0.3 `tools/check-docs.mjs`, `tools/check-all.sh`, `tools/SMOKE.md`

### BL-0.4 🟢 Pre-commit hook
Create `.git/hooks/pre-commit` (executable) running `bash tools/check-all.sh`; document `--no-verify` escape for docs-only commits in a comment at the top of the hook.
**Refs:** tools/check-all.sh
**Done when:** a commit with a broken seed edge is rejected; `git commit --no-verify` still works.
**Verify:** intentionally break a seed edge id, attempt commit (must fail), restore, commit passes.

## Phase 1 — Data & repo hygiene (cheapens everything after)

### BL-1.1 🟢 cedict.json diet
Modify `scripts/parse-cedict.mjs` to emit only single-character simplified entries and only the fields the app reads (`useCedict.js` determines the contract — read it first). Keep the existing skip rules (surname/name-of/variant) and most-meanings conflict rule. Target < 2 MB (currently 21.7 MB). Regenerate `public/cedict.json`.
**Refs:** scripts/parse-cedict.mjs, src/hooks/useCedict.js, CLAUDE.md § CC-CEDICT setup
**Done when:** file < 2 MB; app lookups for 明/鱼/水 return same pinyin+meanings as before the diet (record before-values in the commit message).
**Verify:** `node tools/check-graph-data.mjs && [ $(wc -c < public/cedict.json) -lt 2000000 ]`

### BL-1.2 🟢 Dictionary git flip (depends BL-1.1)
Currently backwards for deploy: raw `cedict_ts.u8` (20+ MB) is tracked; generated `public/cedict.json` is gitignored. Flip: `git rm --cached cedict_ts.u8`, add it to `.gitignore`, remove `public/cedict.json` from `.gitignore`, track the dieted json.
**Refs:** .gitignore, CLAUDE.md § CC-CEDICT setup
**Done when:** `git ls-files` shows `public/cedict.json` and not `cedict_ts.u8`; fresh-clone note added to README run instructions.
**Verify:** `git ls-files | grep -q "public/cedict.json" && ! git ls-files | grep -q "cedict_ts.u8" && bash tools/check-all.sh`

### BL-1.3 🔴 Etymology prototype location (D3)
Present the two options with tradeoffs (repo `/prototypes` folder vs. creative-coding-library entry + removal). Wait for Jen's pick, then execute.
**Refs:** PRD.md § Open questions

## Phase 2 — Canvas ergonomics

### BL-2.1 🟢 Edge label editing UI
UI only — `useGraphStore.updateEdgeLabel(id, label)` and `data.label` already exist. Add click-to-edit: clicking an edge's label (or midpoint if label empty) swaps in an inline input; Enter/blur commits via `updateEdgeLabel`, Esc cancels. Render labels in `--font-body` italic, `--text-tertiary`.
**Refs:** src/components/HanziEdges.jsx, src/hooks/useGraphStore.js (updateEdgeLabel), src/styles/app.css tokens
**Done when:** clicking the 明–光 edge label lets you rename "bright" → typed text; persists through hard refresh; Esc leaves the old value.
**Verify:** `bash tools/check-all.sh` + SMOKE.md, adding the rename route above.

### BL-2.2 🟢 Node context menu
Right-click a node → menu: Delete, Toggle radical, Pin/Release (physics), Edit note (focuses detail-panel note field). Wire via React Flow `onNodeContextMenu`; menu closes on outside click and Esc. Style with existing tokens/surfaces only.
**Refs:** src/App.jsx, src/hooks/useGraphStore.js, src/hooks/useForceLayout.js (pinning), src/styles/app.css
**Done when:** all four actions work on 明; menu never renders off-viewport; left-click behavior unchanged.
**Verify:** `bash tools/check-all.sh` + SMOKE.md, adding: right-click each action once.

### BL-2.3 🟢 Confirm-on-delete
Orphan-edge cleanup already exists in `deleteNode` (verified). Add a confirm dialog when the node has ≥1 edge, listing count of edges that will go with it. No dialog for edgeless nodes.
**Refs:** src/hooks/useGraphStore.js (deleteNode), src/components/DetailPanel.jsx
**Done when:** deleting 明 warns "3 connections"; deleting an edgeless test node doesn't prompt.
**Verify:** `bash tools/check-all.sh` + SMOKE.md.

## Phase 3 — Search & filter

### BL-3.1 🟢 Toolbar search
Search input in toolbar matching character, pinyin (reuse the normalizer in `useCedict.js` — do not write a second one), or note text. Matches highlight; non-matches dim (CSS class on nodes, not removal — physics must not reflow). Empty query restores all.
**Refs:** src/App.jsx, src/hooks/useCedict.js (normalizer), src/hooks/useGraphStore.js
**Done when:** `ming` highlights 明; `mu` highlights 木; dimmed nodes stay interactive; clearing restores.
**Verify:** `bash tools/check-all.sh` + SMOKE.md.

### BL-3.2 🟢 Radicals-only filter
Toggle: show radicals (dark nodes) at full opacity, dim compounds. Composes with search (both active = intersection). Clear-all-filters affordance when any filter active.
**Refs:** src/App.jsx, BL-3.1 implementation
**Done when:** toggle dims 明/林/森/光, leaves 日/月/木 full; works with search active.
**Verify:** `bash tools/check-all.sh` + SMOKE.md.

### BL-3.3 🟢 Neighborhood focus
Alt-click (or long-press) a node → dim everything outside its connected subgraph (BFS over both edge types). Same interaction again or Esc clears.
**Refs:** src/App.jsx, src/hooks/useGraphStore.js
**Done when:** alt-click 木 keeps 木/林/森 full and dims the light cluster; Esc restores.
**Verify:** `bash tools/check-all.sh` + SMOKE.md.

## Phase 4 — Stroke practice

### BL-4.1 🟢 Practice mode
Add Hanzi Writer `quiz()` mode to `StrokeOrderWriter.jsx` with a watch/practice toggle in the detail panel. Existing watch behavior unchanged. Quiz uses default leniency; no scoring UI — completion redraws the character once, quietly.
**Refs:** src/components/StrokeOrderWriter.jsx, src/components/DetailPanel.jsx, hanzi-writer docs (quiz API)
**Done when:** practice mode on 明 accepts traced strokes and completes; toggling back to watch replays animation; error state (BL-4.2) unaffected.
**Verify:** `bash tools/check-all.sh` + SMOKE.md, adding: trace one full character.

### BL-4.2 🟢 Quiz-mode fallback parity
Error state for CDN-missing characters is verified present for watch mode. Confirm it also covers quiz mode (a character with no stroke data must show the same error overlay, not a broken quiz).
**Refs:** src/components/StrokeOrderWriter.jsx (status state machine)
**Done when:** a bogus character (e.g. rare char absent from hanzi-writer-data) shows the error overlay in both modes.
**Verify:** `bash tools/check-all.sh` + SMOKE.md.

## Phase 5 — Demo-ready deployment

### BL-5.1 🔴 Seed graph clusters (D1)
Jen picks the 3–4 clusters and characters (candidates in PRD). This is the demo's narrative — content design, hers.

### BL-5.2 🟢 Curated seed import (depends BL-5.1; BAKE=1 commit)
Translate Jen's picked clusters into `SEED_NODES`/`SEED_EDGES` with positions, both edge types represented, notes written by Jen (placeholder `''` where she hasn't). This is a bake: commit with `BAKE=1` and say so in the message.
**Refs:** src/data/seedData.js, tools/check-graph-data.mjs
**Done when:** 25–35 nodes; every cluster connected; ≥1 semantic edge per cluster; reset-to-seed loads it.
**Verify:** `BAKE=1 bash tools/check-all.sh` (data gate validates structure).

### BL-5.3 🟡 First-visit onboarding hint
Build a dismissible hint layer explaining dark vs. light nodes and solid vs. dashed edges, behind tunables: copy strings, position, delay, and show-once localStorage flag name in one obvious config object at the top of the component. Then stop — Jen tunes copy and placement, hands back values, worker bakes verbatim.
**Refs:** src/App.jsx, src/styles/app.css tokens, PRD § Demo-ready deployment
**Done when (build phase):** hint renders from config; dismiss persists; config keys all do something.
**Verify:** `bash tools/check-all.sh` + SMOKE.md. Hand-off note in Worker notes when ready for Jen.

### BL-5.4 🔴 Reset-to-seed affordance (D2)
Present options (current sidebar button / prominent toolbar action / first-visit-only banner) with tradeoffs. Wait for pick; execute as 🟢.

### BL-5.5 🟡 Public README
Draft structure + screenshots + run instructions (including fresh-clone cedict note from BL-1.2). Voice is Jen's — draft, then stop for her edit pass. Done = her edited text committed.
**Refs:** PRD.md, CLAUDE.md, existing README.md
**Verify:** `node tools/check-docs.mjs` (structure), Jen's sign-off (voice).

### BL-5.6 🔴 Deploy (Jen's hands)
Vercel/Netlify account, project link, first deploy. Requires her accounts — workers prepare `vite.config.js` needs nothing; just document any base-path gotcha found. Post-deploy: verify Web Speech + hanzi-writer CDN in prod, load < 3 s.

### BL-5.7 — Stranger test (Jen)
One person, no coaching, 2 minutes. Note where they stall. Findings feed PRD.

## Phase 6 — v1.1 · Cross-device sync (post-v1)

> Post-v1 commitment (PRD § Committed next). **Owner-only** durable sync: Jen's
> graph persists to a cloud store, survives browser wipes, and follows her across
> devices. Portfolio visitors keep the localStorage fork untouched — no auth wall,
> ever. **Nothing here blocks the v1 ship**, and the whole phase gates on D4.

### BL-6.1 🔴 Sync backend, auth & conflict model (D4)
Present options with tradeoffs and wait for Jen's pick:
- **Backend** — Supabase vs. alternatives (Firebase, a minimal custom API).
- **Sign-in** — magic link vs. OAuth.
- **Conflict model** — same graph edited offline on two devices: last-write-wins vs. merge.
This choice adds an npm dependency **and** changes how the frozen `hanzi-graph-nodes/edges` keys are used (cloud becomes source of truth) — both forbidden to a worker unilaterally, so it gates every task below.
**Refs:** PRD.md § Committed next (v1.1), § Open questions
**Done when:** backend, sign-in method, and conflict model are recorded here and D4 is closed.

### BL-6.2 🟢 Auth & session (depends BL-6.1; authorizes the chosen SDK dep)
Sign-in / sign-out UI for Jen using the picked method; session persists across reloads. Signed-out state is byte-identical to today's app (localStorage-only) — visitors never see auth.
**Refs:** src/App.jsx, chosen backend SDK docs
**Done when:** Jen signs in and out; signed-out behavior matches the current app exactly.
**Verify:** `bash tools/check-all.sh` + SMOKE.md, adding: sign in, reload, sign out.

### BL-6.3 🟢 Cloud persistence layer (depends BL-6.2)
On sign-in the cloud copy is authoritative; localStorage becomes an offline write-through cache. Preserve the frozen key shapes (no schema migration without a separate 🔴). Graph mutations write through to the cloud when signed in. Implement the conflict model picked in BL-6.1.
**Refs:** src/hooks/useGraphStore.js, PRD § Committed next
**Done when:** a character added on device A appears on device B after sign-in; offline edits flush on reconnect.
**Verify:** `bash tools/check-all.sh` + SMOKE.md, plus the two-device route above.

### BL-6.4 🟢 First-sign-in migration (depends BL-6.3)
On Jen's first sign-in, upload her existing localStorage graph to the cloud with no loss (frozen-keys rule: existing graphs must survive). Idempotent — signing in on an already-synced device never duplicates.
**Refs:** src/hooks/useGraphStore.js, CLAUDE.md § Persistence
**Done when:** a device with a pre-existing local graph, on first sign-in, ends with that graph in the cloud, nothing lost or duplicated.
**Verify:** `bash tools/check-all.sh` + SMOKE.md.

## 🧪 Prototype lane — Jen's explorations (not for workers)

> **These are yours.** Cheap, time-boxed prototypes — a single HTML file or a
> branch is enough. Each has one question to answer; if the answer is yes, the
> feature gets specced into this backlog properly.

- **Compound discovery** — *Question: how does a multi-character compound render as a node without breaking the 80×80 grid and the dark/light encoding?* Suggested cheap form: static mock of 3 candidate node treatments on a copy of the current canvas. Decide suggest-on-add vs. explorer only after the rendering question is answered.
- **SRS surfacing** — *Question: does any stale-node visual, however subtle, fight the exploratory feel?* Suggested cheap form: hard-code fake "stale" state on 2 nodes, try 2–3 treatments (faded ring, ink-wash dot, opacity), live with it for a week of real use.
- *(From the cut list, if it ever itches: semantic field colouring would prototype the same way as SRS — fake it on the canvas first.)*

## Deliberately NOT in this backlog

- Etymology trails & character scene animations — cut in PRD v1.0 (unbounded per-character art cost). Prototypes preserved pending D3.
- Shareable read-only URLs — superseded by deployed-demo story. (Cross-device sync is now Phase 6 / v1.1, no longer cut.)
- Semantic field colouring — not selected for v1.
- Any localStorage schema migration — requires a 🔴 first.

## Suggested order

🟢 lane, serial (shared files noted): BL-0.4 → BL-1.1 → BL-1.2 → BL-2.1 → BL-2.3 → BL-2.2 → BL-3.1 → BL-3.2 → BL-3.3 → BL-4.1 → BL-4.2.
Phases 2–3 all touch `App.jsx`/store — keep serial. BL-1.x is disjoint from Phase 2 and could run parallel in a worktree.
Batch for Jen (one sitting): D1–D3 decisions + 🟡 hand-offs (BL-5.3 tuning, BL-5.5 voice pass) + prototype lane whenever it calls to you.
BL-5.2/5.3/5.5 unblock only after their decisions/builds; BL-5.6/5.7 close v1.
Phase 6 (v1.1) is post-ship: D4 first (its own sitting), then BL-6.2 → BL-6.3 → BL-6.4 serial. Do not start it until v1 is out.

## Worker notes

*(Append dated notes here when blocked. Newest first.)*
