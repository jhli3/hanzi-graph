# ORCHESTRATION.md — kickoff prompt for delegated backlog runs

Usage: start a fresh session (Opus-class model recommended as orchestrator) in
this folder and paste the prompt below. Before each run, update the **Run
list** line — everything else stays verbatim. After a run, the report tells
you what goes in the next run list.

---

You are the ORCHESTRATOR for the 字图 Hanzi Graph backlog. You review and
dispatch; you never write code yourself.

Setup — read in this order:
1. CLAUDE.md (the operating manual — it wins over everything)
2. BACKLOG.md (task specs, autonomy labels, worker protocol, standing rules)
3. `git log --oneline -10` and `git status` (confirm clean tree; if dirty,
   stop and report)

**Run list:** BL-0.4, BL-1.1, BL-1.2, BL-2.1, BL-2.3 — in that order, serial.
(BL-1.1/1.2 are disjoint from Phase 2 files and may run as a parallel subagent
in a worktree; BL-2.x tasks share `App.jsx`/store and stay serial.)

For each task:
- Spawn ONE fresh subagent. Its prompt: "Read CLAUDE.md, then BACKLOG.md.
  Execute <task-id> exactly per its spec and the worker protocol. Run the
  task's Verify command(s); do not commit red. Never modify anything in
  `tools/` in the same commit as implementation changes. If blocked, append a
  dated Worker note to BACKLOG.md, commit that, and stop."
- Model tiers: cheapest (Haiku-class) for mechanical tasks with an existing
  verifier (BL-0.4, BL-1.2); mid-tier (Sonnet-class) for UI/interaction work
  (BL-1.1 — parser changes need care with the lookup contract; BL-2.x).
- When it finishes, review the diff yourself before accepting:
  - commit message is `BL-<id>: <summary>`, one task per commit
  - the task's done-when checklist is actually satisfied, not approximated
  - Verify passes when YOU re-run it: `bash tools/check-all.sh`
  - no edits to `tools/` alongside implementation changes
  - no changes to authored values (`:root` tokens in `src/styles/app.css`,
    `src/data/seedData.js`) unless the task is explicitly a bake — full
    precision preserved
  - tripwires: no new dependencies, no version bumps, no new hex colors in
    components (tokens only), localStorage keys unchanged, no edits to
    `etymology-*.html`
- Reject = revert the commit, respawn once with the rejection reason in the
  prompt. A second failure on the same task: write a Worker note, skip the
  task and everything depending on it, continue with what's independent.

Hard boundaries:
- Never start a 🟡, 🔴, or 🧪 task. Never resolve a registered decision
  (D1–D3). The 🧪 prototype lane belongs to Jen personally — do not "help".
- `etymology-*.html`, `cedict_ts.u8`: read, never write.

When the run ends (all tasks done, or nothing unblocked remains): commit any
Worker notes, then report: tasks completed with commit hashes, tasks
skipped/blocked and why, anything you saw that belongs in CLAUDE.md as a new
rule, and which 🟡/🔴 items are now ready for Jen.
