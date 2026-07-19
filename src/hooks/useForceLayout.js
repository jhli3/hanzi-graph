// src/hooks/useForceLayout.js
//
// Wires d3-force into React Flow. Physics runs continuously — there is no
// on/off toggle anymore, and nodes are never permanently pinned. Dragging a
// node fixes it only for the duration of the drag (so it tracks the cursor
// exactly); on drop it rejoins the simulation so bundles keep forming
// naturally as characters and connections are added.
//
// Requires d3-force — install it if you haven't:
//   npm install d3-force

import { useEffect, useRef, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
} from 'd3-force';
import { useReactFlow } from 'reactflow';

// How strongly connected nodes attract each other
const LINK_STRENGTH    = 0.08;
// Rest length of a link (pixels) — nodes settle at roughly this distance apart
const LINK_DISTANCE    = 180;
// How strongly unconnected nodes repel — negative = repulsion
const CHARGE_STRENGTH  = -320;
// Repulsion stops being applied past this distance — without a cap, two
// nodes with no shared connections (or in a sparse graph generally) just
// keep pushing each other apart with nothing to stop them. This is set well
// past LINK_DISTANCE so connected pairs (~180px apart) are unaffected.
const CHARGE_MAX_DISTANCE = 450;
// Minimum distance between node centres before collision force kicks in
const COLLIDE_RADIUS   = 60;
// Gentle pull toward the graph's own center of mass (recomputed every tick,
// not a fixed canvas point — see centerRef below). This is what actually
// keeps a sparse or loosely-connected graph from drifting apart over time;
// the distance cap above just stops runaway repulsion, it doesn't pull
// anything back together on its own. Deliberately weak so it doesn't fight
// the link force inside well-connected clusters.
const CENTER_STRENGTH  = 0.03;
// 0–1: how quickly the simulation loses energy. Higher = snappier settle.
const VELOCITY_DECAY   = 0.55;

export function useForceLayout() {
  const { setNodes, getNodes, getEdges } = useReactFlow();
  const simulationRef = useRef(null);
  const dNodeById      = useRef(new Map()); // id -> d3 node object (mutated in place by d3)
  // Center of mass of the current graph — read by the forceX/forceY center
  // force below, recomputed each tick. A moving target rather than a fixed
  // canvas point, so it doesn't fight you if you've dragged the whole
  // cluster somewhere else; it just tracks wherever "the graph" currently is.
  const centerRef = useRef({ x: 400, y: 280 });

  const tick = useCallback(() => {
    const dNodes = dNodeById.current;
    if (dNodes.size > 0) {
      let sx = 0, sy = 0;
      for (const d of dNodes.values()) { sx += d.x; sy += d.y; }
      centerRef.current = { x: sx / dNodes.size, y: sy / dNodes.size };
    }
    setNodes(prev => prev.map(n => {
      const d = dNodeById.current.get(n.id);
      if (!d) return n;
      return { ...n, position: { x: d.x - 40, y: d.y - 40 } };
    }));
  }, [setNodes]);

  // Reconcile the simulation's node/link set with React Flow's current
  // nodes/edges. Existing nodes keep their settled d3 position (so this can
  // be called on every add/remove without the whole graph jumping); new
  // nodes are seeded at the position they were created with.
  const syncTopology = useCallback(() => {
    const sim = simulationRef.current;
    if (!sim) return;

    const rfNodes = getNodes();
    const rfEdges = getEdges();

    const next = new Map();
    for (const n of rfNodes) {
      const existing = dNodeById.current.get(n.id);
      next.set(n.id, existing ?? {
        id: n.id,
        x: n.position.x + 40, // centre of 80px node
        y: n.position.y + 40,
        fx: null,
        fy: null,
      });
    }
    dNodeById.current = next;

    const nodeArr = Array.from(next.values());
    sim.nodes(nodeArr);
    sim.force('link').links(
      rfEdges
        .filter(e => next.has(e.source) && next.has(e.target))
        .map(e => ({ source: e.source, target: e.target }))
    );
    sim.alpha(0.4).restart();
  }, [getNodes, getEdges]);

  // ── Build the simulation once and keep it alive for the component's
  // lifetime — syncTopology() reconciles it as the graph changes, rather
  // than tearing it down (which would lose everyone's settled position).
  useEffect(() => {
    const sim = forceSimulation([])
      .velocityDecay(VELOCITY_DECAY)
      .force('link', forceLink([]).id(d => d.id).distance(LINK_DISTANCE).strength(LINK_STRENGTH))
      .force('charge', forceManyBody().strength(CHARGE_STRENGTH).distanceMax(CHARGE_MAX_DISTANCE))
      .force('collide', forceCollide(COLLIDE_RADIUS))
      .force('x', forceX(() => centerRef.current.x).strength(CENTER_STRENGTH))
      .force('y', forceY(() => centerRef.current.y).strength(CENTER_STRENGTH))
      .on('tick', tick);

    simulationRef.current = sim;
    syncTopology();

    return () => {
      sim.stop();
      simulationRef.current = null;
    };
  // Build once on mount — syncTopology is stable via useCallback and is
  // called explicitly (not through this effect) whenever the graph changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pin a node when the user starts dragging it — tracks the cursor exactly ──
  const onNodeDragStart = useCallback((_, node) => {
    const d = dNodeById.current.get(node.id);
    if (!d || !simulationRef.current) return;
    d.fx = node.position.x + 40;
    d.fy = node.position.y + 40;
    simulationRef.current.alpha(0.3).restart();
  }, []);

  // ── Track drag — update pinned position every frame ───────────────────
  const onNodeDrag = useCallback((_, node) => {
    const d = dNodeById.current.get(node.id);
    if (!d) return;
    d.fx = node.position.x + 40;
    d.fy = node.position.y + 40;
  }, []);

  // ── Release on drop — node rejoins the simulation instead of staying put ──
  const onNodeDragStop = useCallback((_, node) => {
    const d = dNodeById.current.get(node.id);
    if (!d || !simulationRef.current) return;
    d.fx = null;
    d.fy = null;
    simulationRef.current.alpha(0.3).restart();
  }, []);

  return {
    syncTopology,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  };
}
