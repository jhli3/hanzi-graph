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

  const [showModal, setShowModal] = useState(false);

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

        {/* ── Bottom nav — tool group + separate Add character button ───── */}
        <div className="bottom-nav">
          <div className="bottom-toolbar" role="toolbar" aria-label="Canvas tools">
            <button
              className={`bottom-toolbar__btn ${toolMode === 'select' ? 'bottom-toolbar__btn--active' : ''}`}
              onClick={() => setToolMode('select')}
              title="Explore"
            >
              <span className="material-symbols-outlined">pan_tool</span>
            </button>
            <button
              className={`bottom-toolbar__btn ${toolMode === 'connect' ? 'bottom-toolbar__btn--active' : ''}`}
              onClick={() => setToolMode('connect')}
              title="Connect — drag between characters to draw an edge"
            >
              <span className="material-symbols-outlined">polyline</span>
            </button>

            {toolMode === 'connect' && (
              <>
                <div className="bottom-toolbar__divider" />
                <button
                  className={`bottom-toolbar__chip ${edgeMode === 'component' ? 'bottom-toolbar__chip--active' : ''}`}
                  onClick={() => setEdgeMode('component')}
                  title="Next edge will be: component (solid)"
                >
                  component
                </button>
                <button
                  className={`bottom-toolbar__chip ${edgeMode === 'semantic' ? 'bottom-toolbar__chip--active' : ''}`}
                  onClick={() => setEdgeMode('semantic')}
                  title="Next edge will be: semantic (dashed)"
                >
                  semantic
                </button>
              </>
            )}
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
