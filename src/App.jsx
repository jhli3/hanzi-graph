import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useGraphStore } from './hooks/useGraphStore';
import { useForceLayout } from './hooks/useForceLayout';
import HanziNode from './components/HanziNode';
import { ComponentEdge, SemanticEdge } from './components/HanziEdges';
import DetailPanel from './components/DetailPanel';
import AddCharacterModal from './components/AddCharacterModal';
import './styles/app.css';

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
  const toolMode       = useGraphStore(s => s.toolMode);
  const edgeMode       = useGraphStore(s => s.edgeMode);
  const setToolMode    = useGraphStore(s => s.setToolMode);
  const setEdgeMode    = useGraphStore(s => s.setEdgeMode);
  const clearSelection = useGraphStore(s => s.clearSelection);
  const selectedNodeId = useGraphStore(s => s.selectedNodeId);
  const resetToSeed    = useGraphStore(s => s.resetToSeed);

  const [showModal, setShowModal]           = useState(false);
  const [physicsEnabled, setPhysicsEnabled] = useState(false);

  // ── Step 3: force layout hook ──────────────────────────────────────────
  const {
    reheat,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onNodeDoubleClick,
  } = useForceLayout(physicsEnabled);

  // ── Step 4: reheat when nodes or edges are added/removed ──────────────
  const prevCountRef = useRef(nodes.length + edges.length);
  useEffect(() => {
    const count = nodes.length + edges.length;
    if (count !== prevCountRef.current) {
      prevCountRef.current = count;
      reheat();
    }
  }, [nodes.length, edges.length, reheat]);

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return (
    <div className="app-shell">
      <ArrowMarkers />

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <nav className="sidebar" aria-label="Main navigation">
        <div className="sidebar__logo" title="Hanzi Graph">字</div>
        <button
          className={`sidebar__btn ${toolMode === 'select' ? 'sidebar__btn--active' : ''}`}
          onClick={() => setToolMode('select')}
          title="Select mode"
        >
          ◻
        </button>
        <button
          className={`sidebar__btn ${toolMode === 'connect' ? 'sidebar__btn--active' : ''}`}
          onClick={() => setToolMode('connect')}
          title="Connect mode — drag between nodes to create edges"
        >
          ⌁
        </button>
        <div className="sidebar__spacer" />
        <button
          className="sidebar__btn sidebar__btn--danger"
          onClick={() => { if (confirm('Reset graph to seed data?')) resetToSeed(); }}
          title="Reset graph"
        >
          ↺
        </button>
      </nav>

      {/* ── Canvas ──────────────────────────────────────────────────── */}
      <div className="canvas-wrap">

        {/* Toolbar */}
        <div className="canvas-toolbar">
          <span className="canvas-toolbar__label">hanzi graph</span>
          <div className="canvas-toolbar__divider" />

          <button
            className={`toolbar-btn ${toolMode === 'select' ? 'toolbar-btn--active' : ''}`}
            onClick={() => setToolMode('select')}
            title="Select"
          >
            select
          </button>
          <button
            className={`toolbar-btn ${toolMode === 'connect' ? 'toolbar-btn--active' : ''}`}
            onClick={() => setToolMode('connect')}
            title="Draw edges — drag from node to node"
          >
            connect
          </button>

          <div className="canvas-toolbar__divider" />

          <button
            className={`toolbar-btn ${edgeMode === 'component' ? 'toolbar-btn--active' : ''}`}
            onClick={() => setEdgeMode('component')}
            title="Next edge will be: component"
          >
            — component
          </button>
          <button
            className={`toolbar-btn ${edgeMode === 'semantic' ? 'toolbar-btn--active' : ''}`}
            onClick={() => setEdgeMode('semantic')}
            title="Next edge will be: semantic"
          >
            ⋯ semantic
          </button>

          <div className="canvas-toolbar__divider" />
          <button
            className={`toolbar-btn ${physicsEnabled ? 'toolbar-btn--active' : ''}`}
            onClick={() => setPhysicsEnabled(v => !v)}
            title="Toggle node physics"
          >
            {physicsEnabled ? '⦿ physics on' : '◎ physics off'}
          </button>
        </div>

        {/* Add button */}
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add character
        </button>

        {/* React Flow canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={toolMode === 'select'}
          nodesConnectable={toolMode === 'connect'}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
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
            nodeColor={n => n.data?.isRadical ? 'var(--node-radical-bg)' : 'var(--node-bg)'}
            maskColor="var(--minimap-mask)"
            className="rf-minimap"
          />
        </ReactFlow>

        {/* Edge mode hint */}
        {toolMode === 'connect' && (
          <div className="connect-hint">
            Drag from any node handle to another to draw a <strong>{edgeMode}</strong> edge
          </div>
        )}
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