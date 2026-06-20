import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useGraphStore } from '../hooks/useGraphStore';

// Tone marks for display
const TONE_COLORS = ['', '#c0392b', '#27ae60', '#e67e22', '#2980b9'];

function HanziNode({ id, data, selected }) {
  const selectNode = useGraphStore(s => s.selectNode);
  const toolMode = useGraphStore(s => s.toolMode);
  const { char, pinyin, meaning, isRadical } = data;

  return (
    <div
      className={[
        'hanzi-node',
        isRadical ? 'hanzi-node--radical' : '',
        selected ? 'hanzi-node--selected' : '',
      ].join(' ')}
      onClick={() => toolMode === 'select' && selectNode(id)}
    >
      {/* React Flow connection handles — invisible but functional */}
      <Handle type="target" position={Position.Top}    className="hanzi-handle" />
      <Handle type="target" position={Position.Left}   className="hanzi-handle" />
      <Handle type="source" position={Position.Bottom} className="hanzi-handle" />
      <Handle type="source" position={Position.Right}  className="hanzi-handle" />

      <span className="hanzi-node__char">{char}</span>
      <span className="hanzi-node__pinyin">{pinyin}</span>
      <span className="hanzi-node__meaning">{meaning.split(',')[0]}</span>
    </div>
  );
}

export default memo(HanziNode);
