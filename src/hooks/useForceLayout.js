// src/hooks/useForceLayout.js
//
// Wires d3-force into React Flow.
// Import and call this inside your GraphApp component.
//
// Requires d3-force — install it if you haven't:
//   npm install d3-force

import { useEffect, useRef, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
} from 'd3-force';
import { useReactFlow } from 'reactflow';
import { useGraphStore } from './useGraphStore';

// How strongly connected nodes attract each other
const LINK_STRENGTH    = 0.08;
// Rest length of a link (pixels) — nodes settle at roughly this distance apart
const LINK_DISTANCE    = 180;
// How strongly unconnected nodes repel — negative = repulsion
const CHARGE_STRENGTH  = -320;
// Minimum distance between node centres before collision force kicks in
const COLLIDE_RADIUS   = 60;
// 0–1: how quickly the simulation loses energy. Higher = snappier settle.
const VELOCITY_DECAY   = 0.55;

export function useForceLayout(enabled) {
  const { setNodes, getNodes, getEdges } = useReactFlow();
  const simulationRef = useRef(null);
  const nodesRef      = useRef([]);   // d3 mutates these in place
  const pinnedRef     = useRef(new Set()); // ids of user-pinned nodes

  // ── Build / rebuild simulation whenever enabled toggles on ──────────────
  useEffect(() => {
    if (!enabled) {
      // Stop and discard the simulation when physics is turned off
      simulationRef.current?.stop();
      simulationRef.current = null;
      return;
    }

    const rfNodes = getNodes();
    const rfEdges = getEdges();

    // Copy positions into d3 node objects.
    // d3 mutates these directly on each tick.
    nodesRef.current = rfNodes.map(n => ({
      id:  n.id,
      x:   n.position.x + 40,  // centre of 80px node
      y:   n.position.y + 40,
      fx:  pinnedRef.current.has(n.id) ? n.position.x + 40 : null,
      fy:  pinnedRef.current.has(n.id) ? n.position.y + 40 : null,
    }));

    const idToIndex = new Map(nodesRef.current.map((n, i) => [n.id, i]));

    const links = rfEdges
      .map(e => ({
        source: idToIndex.get(e.source),
        target: idToIndex.get(e.target),
      }))
      .filter(l => l.source !== undefined && l.target !== undefined);

    const sim = forceSimulation(nodesRef.current)
      .velocityDecay(VELOCITY_DECAY)
      .force('link', forceLink(links)
        .distance(LINK_DISTANCE)
        .strength(LINK_STRENGTH)
      )
      .force('charge', forceManyBody()
        .strength(CHARGE_STRENGTH)
      )
      .force('collide', forceCollide(COLLIDE_RADIUS))
      .on('tick', () => {
        setNodes(prev => prev.map(n => {
          const d = nodesRef.current[idToIndex.get(n.id)];
          if (!d) return n;
          return {
            ...n,
            position: { x: d.x - 40, y: d.y - 40 },
          };
        }));
      });

    simulationRef.current = sim;

    return () => { sim.stop(); };
  // Rebuild only when enabled changes — edge/node changes handled separately
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── Reheat when graph topology changes (nodes/edges added or removed) ──
  const reheat = useCallback(() => {
    simulationRef.current?.alpha(0.4).restart();
  }, []);

  // ── Pin a node when the user starts dragging it ───────────────────────
  const onNodeDragStart = useCallback((_, node) => {
    if (!simulationRef.current) return;
    pinnedRef.current.add(node.id);
    const d = nodesRef.current.find(n => n.id === node.id);
    if (d) {
      d.fx = node.position.x + 40;
      d.fy = node.position.y + 40;
    }
    // Gentle reheat so neighbours respond to the drag
    simulationRef.current.alpha(0.3).restart();
  }, []);

  // ── Track drag — update pinned position every frame ───────────────────
  const onNodeDrag = useCallback((_, node) => {
    if (!simulationRef.current) return;
    const d = nodesRef.current.find(n => n.id === node.id);
    if (d) {
      d.fx = node.position.x + 40;
      d.fy = node.position.y + 40;
    }
  }, []);

  // ── Release: keep node pinned so it stays where you dropped it ────────
  // (matches Obsidian behaviour — nodes don't drift after placing)
  const onNodeDragStop = useCallback((_, node) => {
    if (!simulationRef.current) return;
    const d = nodesRef.current.find(n => n.id === node.id);
    if (d) {
      d.fx = node.position.x + 40;
      d.fy = node.position.y + 40;
    }
    simulationRef.current.alpha(0.15).restart();
  }, []);

  // ── Unpin a node with double-click so it flows freely again ──────────
  const onNodeDoubleClick = useCallback((_, node) => {
    if (!simulationRef.current) return;
    pinnedRef.current.delete(node.id);
    const d = nodesRef.current.find(n => n.id === node.id);
    if (d) { d.fx = null; d.fy = null; }
    simulationRef.current.alpha(0.3).restart();
  }, []);

  return {
    reheat,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onNodeDoubleClick,
  };
}