import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { SEED_NODES, SEED_EDGES } from '../data/seedData';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NODES_KEY = 'hanzi-graph-nodes';
const EDGES_KEY = 'hanzi-graph-edges';

function toFlowNode(node) {
  return {
    id: node.id,
    type: 'hanziNode',
    position: node.position,
    data: node.data,
  };
}

function toFlowEdge(edge) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type === 'semantic' ? 'semanticEdge' : 'componentEdge',
    data: { label: edge.label, relType: edge.type },
    animated: false,
  };
}

function loadFromStorage() {
  try {
    const nodes = JSON.parse(localStorage.getItem(NODES_KEY));
    const edges = JSON.parse(localStorage.getItem(EDGES_KEY));
    if (nodes && edges) return { nodes, edges };
  } catch (_) {}
  return null;
}

function saveToStorage(nodes, edges) {
  try {
    localStorage.setItem(NODES_KEY, JSON.stringify(nodes));
    localStorage.setItem(EDGES_KEY, JSON.stringify(edges));
  } catch (_) {}
}

// ─── Initial state ────────────────────────────────────────────────────────────

const stored = loadFromStorage();

const initialNodes = stored
  ? stored.nodes
  : SEED_NODES.map(toFlowNode);

const initialEdges = stored
  ? stored.edges
  : SEED_EDGES.map(toFlowEdge);

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGraphStore = create((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  edgeMode: 'component',     // 'component' | 'semantic' — which type the next drag-to-connect creates

  // ── React Flow handlers ───────────────────────────────────────────────────
  onNodesChange(changes) {
    set(s => {
      const nodes = applyNodeChanges(changes, s.nodes);
      saveToStorage(nodes, s.edges);
      return { nodes };
    });
  },

  onEdgesChange(changes) {
    set(s => {
      const edges = applyEdgeChanges(changes, s.edges);
      saveToStorage(s.nodes, edges);
      return { edges };
    });
  },

  onConnect(connection) {
    const { edgeMode, nodes, edges } = get();
    const newEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      type: edgeMode === 'semantic' ? 'semanticEdge' : 'componentEdge',
      data: { label: '', relType: edgeMode },
    };
    const updated = addEdge(newEdge, edges);
    saveToStorage(nodes, updated);
    set({ edges: updated });
  },

  // ── Selection ─────────────────────────────────────────────────────────────
  selectNode(id) {
    set({ selectedNodeId: id });
  },

  clearSelection() {
    set({ selectedNodeId: null });
  },

  // ── Toolbar ───────────────────────────────────────────────────────────────
  setEdgeMode(mode) {
    set({ edgeMode: mode });
  },

  // ── Add character ─────────────────────────────────────────────────────────
  addCharacter(charData, position) {
    const id = `${charData.char}-${Date.now()}`;
    const newNode = {
      id,
      type: 'hanziNode',
      position: position ?? { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: { ...charData },
    };
    set(s => {
      const nodes = [...s.nodes, newNode];
      saveToStorage(nodes, s.edges);
      return { nodes, selectedNodeId: id };
    });
    return id;
  },

  // ── Update character note ────────────────────────────────────────────────
  updateNote(id, note) {
    set(s => {
      const nodes = s.nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, note } } : n
      );
      saveToStorage(nodes, s.edges);
      return { nodes };
    });
  },

  // ── Update edge label ────────────────────────────────────────────────────
  updateEdgeLabel(id, label) {
    set(s => {
      const edges = s.edges.map(e =>
        e.id === id ? { ...e, data: { ...e.data, label } } : e
      );
      saveToStorage(s.nodes, edges);
      return { edges };
    });
  },

  // ── Delete node + its edges ───────────────────────────────────────────────
  deleteNode(id) {
    set(s => {
      const nodes = s.nodes.filter(n => n.id !== id);
      const edges = s.edges.filter(e => e.source !== id && e.target !== id);
      saveToStorage(nodes, edges);
      return { nodes, edges, selectedNodeId: null };
    });
  },

  // ── Reset to seed data ────────────────────────────────────────────────────
  resetToSeed() {
    const nodes = SEED_NODES.map(toFlowNode);
    const edges = SEED_EDGES.map(toFlowEdge);
    saveToStorage(nodes, edges);
    set({ nodes, edges, selectedNodeId: null });
  },
}));
