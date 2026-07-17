# Browser smoke procedure

Run after any commit that touches UI (components, styles, App.jsx, hooks).
Identical every time — do not improvise a different route.

1. `npm run dev` → open the printed localhost URL.
2. Open DevTools console. **Zero errors is the bar.** Warnings from React Flow
   about memoization are known noise; anything else fails the smoke.
3. Exercise, in order:
   - Click 明 → detail panel opens; audio button speaks; stroke animation plays.
   - Add-character flow: type `ming` → grid appears → pick a character →
     form auto-fills → Add → node appears on canvas.
   - Drag the new node; toggle physics on; drag a node (it pins);
     double-click it (it releases).
   - Delete the node you added (restore clean state).
   - Toggle physics off. Hard-refresh: graph state persists.
4. Screenshot the full canvas to `smoke-shots/<branch>-<yyyymmdd>.png`
   (folder is gitignored) for before/after comparison.
5. Any step fails → the commit is red regardless of gate status. Write a
   Worker note in BACKLOG.md.
