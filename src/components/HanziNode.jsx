import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useGraphStore } from '../hooks/useGraphStore';

// The node stays a fixed 80x80 regardless of content — longer phrases (东西
// and up) shrink to fit instead. CJK characters are roughly monospace/square,
// so a length-based estimate works without needing to actually measure
// rendered text: ~68px of usable width inside the node's padding, divided
// across however many characters there are, capped at the single-character
// size on one end and a readable floor on the other.
const CHAR_FONT_SIZE_MAX = 28;
const CHAR_FONT_SIZE_MIN = 11;
const CHAR_ROW_USABLE_WIDTH = 68;

function charFontSize(char) {
  const len = [...(char || '')].length;
  if (len <= 1) return CHAR_FONT_SIZE_MAX;
  const fit = Math.floor(CHAR_ROW_USABLE_WIDTH / len);
  return Math.max(CHAR_FONT_SIZE_MIN, Math.min(CHAR_FONT_SIZE_MAX, fit));
}

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

      <span className="hanzi-node__char" style={{ fontSize: charFontSize(char) }}>{char}</span>
      <span className="hanzi-node__pinyin">{pinyin}</span>
      <span className="hanzi-node__meaning">{meaning.split(',')[0]}</span>
    </div>
  );
}

export default memo(HanziNode);
