import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useGraphStore } from './hooks/useGraphStore';
import { useForceLayout } from './hooks/useForceLayout';
import { computeDepthT } from './utils/nodeDepth';
import { lerpRgb, rgbToCss, easeLighter } from './utils/colorInterp';
import HanziNode from './components/HanziNode';
import { ComponentEdge, SemanticEdge } from './components/HanziEdges';
import DetailPanel from './components/DetailPanel';
import AddCharacterModal from './components/AddCharacterModal';
import './styles/app.css';

// Mirrors the same design-token pair + eased skew HanziNode.jsx interpolates
// node fill from, so the minimap's dots stay visually consistent with the
// canvas (see the GRADIENT_SKEW comment there for why it's eased).
const MINIMAP_COLOR_ROOT = '#2C2C2A'; // --node-radical-bg
const MINIMAP_COLOR_LEAF = '#FFFFFF'; // --node-bg
const MINIMAP_GRADIENT_SKEW = 2.80;

// ─── Register custom types ────────────────────────────────────────────────────
const nodeTypes = { hanziNode: HanziNode };
const edgeTypes = { componentEdge: ComponentEdge, semanticEdge: SemanticEdge };

// ─── SVG arrow markers injected once into the DOM ────────────────────────────
function ArrowMarkers() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker id="arrow-component" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="var(--edge-color)" />
        </marker>
        <marker id="arrow-semantic" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="var(--edge-color)" opacity="0.6" />
        </marker>
      </defs>
    </svg>
  );
}

function GraphApp() {
  const nodes          = useGraphStore(s => s.nodes);
  const edges          = useGraphStore(s => s.edges);
  const onNodesChange  = useGraphStore(s => s.onNodesChange);
  const onEdgesChange  = useGraphStore(s => s.onEdgesChange);
  const onConnect      = useGraphStore(s => s.onConnect);
  const edgeMode       = useGraphStore(s => s.edgeMode);
  const setEdgeMode    = useGraphStore(s => s.setEdgeMode);
  const clearSelection = useGraphStore(s => s.clearSelection);
  const selectedNodeId = useGraphStore(s => s.selectedNodeId);

  const [showModal, setShowModal] = useState(false);

  // ── Per-node depth within its own weakly-connected component (component
  // edges only), injected as data.depthT for HanziNode + the minimap to
  // interpolate fill/text color from. Derived, not persisted — recomputed
  // whenever the underlying nodes/edges change. ──────────────────────────
  const depthNodes = useMemo(() => {
    const depthT = computeDepthT(nodes, edges);
    return nodes.map(n => ({ ...n, data: { ...n.data, depthT: depthT.get(n.id) ?? 0 } }));
  }, [nodes, edges]);

  // ── Force layout — always on, nothing to anchor. Dragging a node just
  // fixes it while you hold it; it rejoins the simulation on drop. ────────
  const {
    syncTopology,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  } = useForceLayout();

  // ── Reconcile the simulation whenever nodes or edges are added/removed ──
  const prevCountRef = useRef(nodes.length + edges.length);
  useEffect(() => {
    const count = nodes.length + edges.length;
    if (count !== prevCountRef.current) {
      prevCountRef.current = count;
      syncTopology();
    }
  }, [nodes.length, edges.length, syncTopology]);

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return (
    <div className="app-shell">
      <ArrowMarkers />

      <div className="brand-mark">字图</div>

      {/* ── Canvas ──────────────────────────────────────────────────── */}
      <div className="canvas-wrap">

        {/* React Flow canvas */}
        <ReactFlow
          nodes={depthNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          connectionRadius={60}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.05}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color="var(--canvas-dot)"
            gap={24}
            size={1}
            variant="dots"
          />
          <Controls showInteractive={false} className="rf-controls" />
          <MiniMap
            nodeColor={n => rgbToCss(lerpRgb(MINIMAP_COLOR_ROOT, MINIMAP_COLOR_LEAF, easeLighter(n.data?.depthT ?? 0, MINIMAP_GRADIENT_SKEW)))}
            maskColor="var(--minimap-mask)"
            className="rf-minimap"
          />
        </ReactFlow>

        {/* ── Bottom nav — edge-type chooser + separate Add character button.
            Dragging a node body moves it and dragging from a handle draws
            an edge, always, at the same time — React Flow already tells
            these apart on its own (handle vs. body), so there's no separate
            "connect mode" to switch into first. This picker just controls
            which edge type the next handle-to-handle drag creates. ───────── */}
        <div className="bottom-nav">
          <div className="bottom-toolbar" role="toolbar" aria-label="Edge type">
            <span className="bottom-toolbar__label">connect as</span>
            <button
              className={`bottom-toolbar__chip ${edgeMode === 'component' ? 'bottom-toolbar__chip--active' : ''}`}
              onClick={() => setEdgeMode('component')}
              title="Drag between characters to draw a component (solid) edge"
            >
              component
            </button>
            <button
              className={`bottom-toolbar__chip ${edgeMode === 'semantic' ? 'bottom-toolbar__chip--active' : ''}`}
              onClick={() => setEdgeMode('semantic')}
              title="Drag between characters to draw a semantic (dashed) edge"
            >
              semantic
            </button>
          </div>

          {/* Reset is hidden for now — not part of Jen's own personal workflow.
              Still in git history (App.jsx, pre this change) if it's wanted back. */}
          <button className="bottom-nav__add-btn" onClick={() => setShowModal(true)}>
            + Add character
          </button>
        </div>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────── */}
      <div className={`panel-wrap ${selectedNodeId ? 'panel-wrap--open' : ''}`}>
        <DetailPanel />
      </div>

      {/* ── Add character modal ───────────────────────────────────────── */}
      {showModal && <AddCharacterModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <GraphApp />
    </ReactFlowProvider>
  );
}
