import { useState, useEffect } from 'react';
import { useGraphStore } from '../hooks/useGraphStore';
import StrokeOrderWriter from './StrokeOrderWriter';
import { charFontSize } from '../utils/charFontSize';

const TONE_LABEL = ['', '1st — flat', '2nd — rising', '3rd — dip-rise', '4th — falling'];

// Panel is --panel-width (248px) wide; header padding + the char row's own
// right-side clearance for the close button leave ~180px of usable width.
// Much roomier than the 80px node, so most phrases stay at full size —
// only long entries (the modal allows up to 12 chars) shrink noticeably.
const CHAR_HERO_FONT_MAX = 52;
const CHAR_HERO_FONT_MIN = 22;
const CHAR_HERO_USABLE_WIDTH = 180;

export default function DetailPanel() {
  const nodes        = useGraphStore(s => s.nodes);
  const edges        = useGraphStore(s => s.edges);
  const selectedId   = useGraphStore(s => s.selectedNodeId);
  const updateNote   = useGraphStore(s => s.updateNote);
  const deleteNode   = useGraphStore(s => s.deleteNode);
  const selectNode   = useGraphStore(s => s.selectNode);

  const node = nodes.find(n => n.id === selectedId);
  const [noteValue, setNoteValue] = useState('');
  const [editingNote, setEditingNote] = useState(false);

  useEffect(() => {
    if (node) setNoteValue(node.data.note ?? '');
    setEditingNote(false);
  }, [selectedId]);

  if (!node) {
    return (
      <aside className="detail-panel detail-panel--empty">
        <div className="detail-panel__empty-hint">
          <span className="detail-panel__empty-char">字</span>
          <p>Select a character<br />to see details</p>
        </div>
      </aside>
    );
  }

  const { char, pinyin, tone, meaning, isRadical, strokes, note } = node.data;

  // Find connected nodes
  const componentSources = edges
    .filter(e => e.target === selectedId && e.data?.relType === 'component')
    .map(e => nodes.find(n => n.id === e.source))
    .filter(Boolean);

  const semanticNeighbors = edges
    .filter(e =>
      (e.source === selectedId || e.target === selectedId) &&
      e.data?.relType === 'semantic'
    )
    .map(e => {
      const otherId = e.source === selectedId ? e.target : e.source;
      return nodes.find(n => n.id === otherId);
    })
    .filter(Boolean);

  function saveNote() {
    updateNote(selectedId, noteValue);
    setEditingNote(false);
  }

  function handleSpeak() {
    if (!('speechSynthesis' in window)) return;
    const utt = new SpeechSynthesisUtterance(char);
    utt.lang = 'zh-CN';
    utt.rate = 0.8;
    window.speechSynthesis.speak(utt);
  }

  return (
    <aside className="detail-panel">
      {/* Header */}
      <div className="detail-panel__header">
        <div
          className="detail-panel__char-hero"
          style={{ fontSize: charFontSize(char, { min: CHAR_HERO_FONT_MIN, max: CHAR_HERO_FONT_MAX, maxWidth: CHAR_HERO_USABLE_WIDTH }) }}
        >{char}</div>
        <div className="detail-panel__char-meta">
          <div className="detail-panel__pinyin">{pinyin}</div>
          <div className="detail-panel__meaning">{meaning}</div>
          {isRadical && <span className="detail-panel__badge">radical</span>}
        </div>
        <button
          className="detail-panel__close"
          onClick={() => useGraphStore.getState().clearSelection()}
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Components */}
      {componentSources.length > 0 && (
        <section className="detail-panel__section">
          <div className="detail-panel__section-label">components</div>
          <div className="detail-panel__chips">
            {componentSources.map(n => (
              <button
                key={n.id}
                className="detail-panel__chip"
                onClick={() => selectNode(n.id)}
              >
                <span className="chip__char">{n.data.char}</span>
                <span className="chip__info">{n.data.meaning.split(',')[0]} · {n.data.pinyin}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Note */}
      <section className="detail-panel__section">
        <div className="detail-panel__section-label">
          my note
          {!editingNote && (
            <button className="detail-panel__text-btn" onClick={() => setEditingNote(true)}>
              edit
            </button>
          )}
        </div>
        {editingNote ? (
          <div className="detail-panel__note-edit">
            <textarea
              className="detail-panel__textarea"
              value={noteValue}
              onChange={e => setNoteValue(e.target.value)}
              placeholder="Your insight about this character…"
              rows={3}
              autoFocus
            />
            <div className="detail-panel__note-actions">
              <button className="detail-panel__btn detail-panel__btn--primary" onClick={saveNote}>Save</button>
              <button className="detail-panel__btn" onClick={() => setEditingNote(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <p className="detail-panel__note">
            {note || <span className="detail-panel__note--empty">No note yet. Click edit to add one.</span>}
          </p>
        )}
      </section>

      {/* Stroke order — Hanzi Writer only animates one character at a time,
          so this is dropped for multi-character entries for now rather than
          showing something misleading (e.g. just the first character's
          strokes). Revisit if a per-character tab/carousel is worth it. */}
      {[...char].length === 1 && (
        <section className="detail-panel__section">
          <div className="detail-panel__section-label">
            stroke order
            {strokes != null && (
              <span className="detail-panel__section-meta">{strokes} strokes</span>
            )}
          </div>
          <StrokeOrderWriter char={char} />
        </section>
      )}

      {/* Audio */}
      <section className="detail-panel__section">
        <div className="detail-panel__section-label">pronunciation</div>
        <button className="detail-panel__audio-btn" onClick={handleSpeak}>
          <span className="audio-btn__icon">▶</span>
          {pinyin} · {TONE_LABEL[tone] ?? 'unknown tone'}
        </button>
      </section>

      {/* Semantic neighbors */}
      {semanticNeighbors.length > 0 && (
        <section className="detail-panel__section">
          <div className="detail-panel__section-label">semantically related</div>
          {semanticNeighbors.map(n => (
            <button
              key={n.id}
              className="detail-panel__related-row"
              onClick={() => selectNode(n.id)}
            >
              <span className="related-row__char">{n.data.char}</span>
              <div className="related-row__info">
                <span className="related-row__pinyin">{n.data.pinyin}</span>
                <span className="related-row__meaning">{n.data.meaning}</span>
              </div>
              <span className="related-row__badge">semantic</span>
            </button>
          ))}
        </section>
      )}

      {/* Danger zone */}
      <div className="detail-panel__footer">
        <button
          className="detail-panel__delete-btn"
          onClick={() => deleteNode(selectedId)}
        >
          Remove character
        </button>
      </div>
    </aside>
  );
}
