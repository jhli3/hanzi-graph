// src/components/AddCharacterModal.jsx

import { useState, useEffect, useRef } from 'react';
import { useGraphStore } from '../hooks/useGraphStore';
import { useCedict } from '../hooks/useCedict';

const EMPTY_FORM = {
  char: '', pinyin: '', tone: 2, meaning: '',
  isRadical: false, strokes: '', note: '',
};

export default function AddCharacterModal({ onClose }) {
  const addCharacter = useGraphStore(s => s.addCharacter);
  const { searchByPinyin, loading: dictLoading, error: dictError } = useCedict();

  // ── Stage: 'search' | 'confirm' ──────────────────────────────────────────
  const [stage,    setStage   ] = useState('search');
  const [query,    setQuery   ] = useState('');
  const [results,  setResults ] = useState([]);
  const [form,     setForm    ] = useState(EMPTY_FORM);
  const [error,    setError   ] = useState('');
  const searchRef = useRef(null);

  // Auto-focus search input on open
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Live search as user types
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setResults(searchByPinyin(query));
  }, [query, searchByPinyin]);

  function selectCharacter(entry) {
    setForm({
      ...EMPTY_FORM,
      char:    entry.simplified,
      pinyin:  entry.pinyinTone,
      tone:    entry.tone || 2,
      meaning: entry.meanings.slice(0, 3).join(', '),
    });
    setStage('confirm');
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.char)    { setError('No character selected.');   return; }
    if (!form.pinyin)  { setError('Pinyin is required.');      return; }
    if (!form.meaning) { setError('Meaning is required.');     return; }
    addCharacter({ ...form, strokes: form.strokes ? Number(form.strokes) : null });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* Header */}
        <div className="modal__header">
          <div className="modal__header-left">
            {stage === 'confirm' && (
              <button className="modal__back" onClick={() => setStage('search')} aria-label="Back">
                ← back
              </button>
            )}
            <h2 className="modal__title">
              {stage === 'search' ? 'Add character' : 'Confirm character'}
            </h2>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Dict status */}
        {dictLoading && (
          <p className="modal__dict-status modal__dict-status--loading">Loading dictionary…</p>
        )}
        {dictError && (
          <p className="modal__dict-status modal__dict-status--error">
            Dictionary unavailable.<br /><small>{dictError}</small>
          </p>
        )}

        {/* ── Stage 1: pinyin search ───────────────────────────────────── */}
        {stage === 'search' && (
          <div className="modal__search-stage">
            <div className="modal__search-wrap">
              <span className="modal__search-icon">🔍</span>
              <input
                ref={searchRef}
                className="modal__search-input"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type pinyin — e.g. ming, guang, shui…"
                autoComplete="off"
                spellCheck={false}
                disabled={dictLoading}
              />
              {query && (
                <button className="modal__search-clear" onClick={() => setQuery('')}>✕</button>
              )}
            </div>

            {/* Results grid */}
            {results.length > 0 && (
              <div className="modal__results-grid" role="listbox" aria-label="Matching characters">
                {results.map(entry => (
                  <button
                    key={entry.simplified}
                    className="modal__result-card"
                    onClick={() => selectCharacter(entry)}
                    role="option"
                    title={entry.meanings[0]}
                  >
                    <span className="result-card__char">{entry.simplified}</span>
                    <span className="result-card__pinyin">{entry.pinyinTone}</span>
                    <span className="result-card__meaning">
                      {entry.meanings[0].length > 18
                        ? entry.meanings[0].slice(0, 16) + '…'
                        : entry.meanings[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {query && !dictLoading && results.length === 0 && (
              <p className="modal__no-results">
                No characters found for <em>"{query}"</em>
              </p>
            )}

            {!query && !dictLoading && (
              <p className="modal__search-hint">
                Search by bare pinyin — tones optional.<br />
                e.g. <em>ming</em> finds 明, 名, 命…
              </p>
            )}
          </div>
        )}

        {/* ── Stage 2: confirm + annotate ─────────────────────────────── */}
        {stage === 'confirm' && (
          <form className="modal__form" onSubmit={handleSubmit}>
            {/* Selected character hero */}
            <div className="modal__char-row">
              <div className="modal__char-input-wrap modal__char-input-wrap--selected">
                <span className="modal__char-display">{form.char}</span>
              </div>
              <div className="modal__char-selected-meta">
                <span className="modal__autofill-badge">auto-filled ✓</span>
                <span className="modal__selected-hint">Edit any field below if needed</span>
              </div>
            </div>

            <div className="modal__fields">
              <div className="modal__field">
                <label className="modal__label">Pinyin</label>
                <input className="modal__input" type="text" value={form.pinyin}
                  onChange={e => setForm(f => ({ ...f, pinyin: e.target.value }))} />
              </div>

              <div className="modal__field">
                <label className="modal__label">Tone</label>
                <select className="modal__input" value={form.tone}
                  onChange={e => setForm(f => ({ ...f, tone: Number(e.target.value) }))}>
                  <option value={1}>1st — flat (ā)</option>
                  <option value={2}>2nd — rising (á)</option>
                  <option value={3}>3rd — dip-rise (ǎ)</option>
                  <option value={4}>4th — falling (à)</option>
                  <option value={0}>Neutral (·a)</option>
                </select>
              </div>

              <div className="modal__field modal__field--full">
                <label className="modal__label">Meaning</label>
                <input className="modal__input" type="text" value={form.meaning}
                  onChange={e => setForm(f => ({ ...f, meaning: e.target.value }))}
                  placeholder="e.g. bright, clear, luminous" />
              </div>

              <div className="modal__field">
                <label className="modal__label">Stroke count</label>
                <input className="modal__input" type="number" value={form.strokes}
                  onChange={e => setForm(f => ({ ...f, strokes: e.target.value }))}
                  placeholder="e.g. 8" min={1} max={64} />
              </div>

              <div className="modal__field modal__field--checkbox">
                <label className="modal__checkbox-label">
                  <input type="checkbox" checked={form.isRadical}
                    onChange={e => setForm(f => ({ ...f, isRadical: e.target.checked }))} />
                  <span>Mark as radical / primitive</span>
                </label>
              </div>

              <div className="modal__field modal__field--full">
                <label className="modal__label">
                  Your note <span className="modal__optional">(optional)</span>
                </label>
                <textarea className="modal__input modal__textarea" value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Your personal insight about this character…"
                  rows={2} />
              </div>
            </div>

            {error && <p className="modal__error">{error}</p>}

            <div className="modal__actions">
              <button type="button" className="modal__btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="modal__btn modal__btn--primary">Add to graph</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}