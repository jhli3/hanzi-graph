import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useGraphStore } from '../hooks/useGraphStore';
import { charFontSize } from '../utils/charFontSize';
import { lerpRgb, rgbToCss, easeLighter, readableTextColor } from '../utils/colorInterp';

// The node stays a fixed 80x80 regardless of content — longer phrases (东西
// and up) shrink to fit instead, via charFontSize. ~68px of usable width
// inside the node's padding, divided across however many characters there
// are, capped at the single-character size on one end and a readable floor
// on the other.
const CHAR_FONT_SIZE_MAX = 28;
const CHAR_FONT_SIZE_MIN = 11;
const CHAR_ROW_USABLE_WIDTH = 68;

// Background is interpolated per node from data.depthT (0 = root/darkest, 1
// = deepest node in its component/white) rather than a fixed radical/compound
// binary — see src/utils/nodeDepth.js for how depthT is computed. These
// mirror the --node-radical-bg / --node-bg design tokens; JS can't read CSS
// custom properties for interpolation, so keep these in sync if the tokens
// change.
//
// The interpolation is eased (GRADIENT_SKEW > 1) so the root stays pure
// black but anything past a shallow depth already reads mostly white with
// just a subtle grey tint, rather than grinding evenly through mid-tones.
//
// Text can't just co-interpolate the same way: blending both bg and text
// linearly toward each other from opposite ends means they cross paths
// in the middle — a mid-gradient node would get grey text on a grey
// background, well under WCAG AA. Instead each text color keeps its
// original hand-tuned root/leaf variant wherever that's already contrasty
// enough against the actual (eased) background, and only falls back to a
// directly-solved grey — guaranteed to hit TEXT_CONTRAST_TARGET — in the
// mid-gradient zone where neither original variant clears the bar alone.
const GRADIENT_SKEW = 2.80;
const TEXT_CONTRAST_TARGET = 4.58; // pushed right up against the ~4.583:1
                                    // hard mathematical ceiling for a grey
                                    // guaranteed against ANY background
const COLOR_ROOT = { bg: '#2C2C2A', char: '#F1EFE8', pinyin: '#B8B6AE', meaning: '#9C9A93' };
const COLOR_LEAF = { bg: '#FFFFFF', char: '#1E1E1C', pinyin: '#5F5E5A', meaning: '#767570' };

function HanziNode({ id, data, selected }) {
  const selectNode = useGraphStore(s => s.selectNode);
  const { char, pinyin, meaning, depthT = 0 } = data;

  const bgT   = easeLighter(depthT, GRADIENT_SKEW);
  const bgRgb = lerpRgb(COLOR_ROOT.bg, COLOR_LEAF.bg, bgT);
  const bg    = rgbToCss(bgRgb);

  const charColor    = rgbToCss(readableTextColor(bgRgb, COLOR_ROOT.char,    COLOR_LEAF.char,    TEXT_CONTRAST_TARGET));
  const pinyinColor   = rgbToCss(readableTextColor(bgRgb, COLOR_ROOT.pinyin, COLOR_LEAF.pinyin,  TEXT_CONTRAST_TARGET));
  const meaningColor  = rgbToCss(readableTextColor(bgRgb, COLOR_ROOT.meaning, COLOR_LEAF.meaning, TEXT_CONTRAST_TARGET));

  return (
    <div
      className={[
        'hanzi-node',
        selected ? 'hanzi-node--selected' : '',
      ].join(' ')}
      style={{ background: bg }}
      onClick={() => selectNode(id)}
    >
      {/* React Flow connection handles — invisible but functional */}
      <Handle type="target" position={Position.Top}    className="hanzi-handle" />
      <Handle type="target" position={Position.Left}   className="hanzi-handle" />
      <Handle type="source" position={Position.Bottom} className="hanzi-handle" />
      <Handle type="source" position={Position.Right}  className="hanzi-handle" />

      <span
        className="hanzi-node__char"
        style={{
          fontSize: charFontSize(char, { min: CHAR_FONT_SIZE_MIN, max: CHAR_FONT_SIZE_MAX, maxWidth: CHAR_ROW_USABLE_WIDTH }),
          color: charColor,
        }}
      >{char}</span>
      <span className="hanzi-node__pinyin" style={{ color: pinyinColor }}>{pinyin}</span>
      <span className="hanzi-node__meaning" style={{ color: meaningColor }}>{meaning.split(',')[0]}</span>
    </div>
  );
}

export default memo(HanziNode);
