// Computes each node's normalized depth (0–1) within its own weakly-connected
// component, based only on `component`-type edges — `semantic` edges are
// loose thematic relatedness, not hierarchical composition, and shouldn't
// factor into "connection length".
//
// depth = length of the longest directed component-edge path reaching a node
// from a root (a node with no incoming component edges). This is
// longest-path-in-DAG, computed via Kahn's algorithm (repeatedly peeling off
// in-degree-0 nodes) so it can't hang on a cycle: React Flow lets users draw
// edges in any direction, so a cycle isn't impossible even if unintended.
// Any node that never reaches in-degree 0 falls back to depth 0.
//
// Normalization is per weakly-connected component (grouped by the same
// component edges), not globally — a short 2-node radical→compound chain
// always spans pure black→white regardless of what a deeper, unrelated
// chain elsewhere in the graph is doing. A node with no component edges at
// all is trivially a root, alone in its own single-node component, and gets
// depthT 0 (darkest) — same as any other root.
export function computeDepthT(nodes, edges) {
  const ids = nodes.map(n => n.id);
  const idSet = new Set(ids);

  const componentEdges = edges.filter(
    e => e.data?.relType === 'component' && idSet.has(e.source) && idSet.has(e.target)
  );

  // ── Longest path per node (Kahn's algorithm) ────────────────────────────
  const outAdj = new Map(ids.map(id => [id, []]));
  const inDegree = new Map(ids.map(id => [id, 0]));
  for (const e of componentEdges) {
    outAdj.get(e.source).push(e.target);
    inDegree.set(e.target, inDegree.get(e.target) + 1);
  }

  const depth = new Map(ids.map(id => [id, 0]));
  const remaining = new Map(inDegree);
  const queue = ids.filter(id => remaining.get(id) === 0);
  const processed = new Set(queue);

  for (let head = 0; head < queue.length; head++) {
    const id = queue[head];
    for (const next of outAdj.get(id)) {
      depth.set(next, Math.max(depth.get(next), depth.get(id) + 1));
      remaining.set(next, remaining.get(next) - 1);
      if (remaining.get(next) === 0) {
        processed.add(next);
        queue.push(next);
      }
    }
  }

  // Cycle members never reach in-degree 0 — force depth 0 rather than
  // trusting whatever partial relaxation happened before they got stuck.
  for (const id of ids) {
    if (!processed.has(id)) depth.set(id, 0);
  }

  // ── Weakly-connected components, grouped by the same component edges ───
  const parent = new Map(ids.map(id => [id, id]));
  function find(id) {
    while (parent.get(id) !== id) {
      parent.set(id, parent.get(parent.get(id)));
      id = parent.get(id);
    }
    return id;
  }
  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  for (const e of componentEdges) union(e.source, e.target);

  const maxDepthByRoot = new Map();
  for (const id of ids) {
    const root = find(id);
    maxDepthByRoot.set(root, Math.max(maxDepthByRoot.get(root) ?? 0, depth.get(id)));
  }

  const depthT = new Map();
  for (const id of ids) {
    const maxDepth = maxDepthByRoot.get(find(id));
    depthT.set(id, maxDepth > 0 ? depth.get(id) / maxDepth : 0);
  }
  return depthT;
}
