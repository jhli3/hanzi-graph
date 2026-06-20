import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getStraightPath, getBezierPath } from 'reactflow';

// ─── Component edge — solid line ─────────────────────────────────────────────
export const ComponentEdge = memo(({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: 'var(--edge-color)', strokeWidth: 1.5 }}
        markerEnd="url(#arrow-component)"
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="edge-label"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

// ─── Semantic edge — dashed line ──────────────────────────────────────────────
export const SemanticEdge = memo(({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: 'var(--edge-color)',
          strokeWidth: 1,
          strokeDasharray: '5 4',
        }}
        markerEnd="url(#arrow-semantic)"
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="edge-label edge-label--semantic"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
