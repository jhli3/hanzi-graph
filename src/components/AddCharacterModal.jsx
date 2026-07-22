// src/components/AddCharacterModal.jsx

import { useState, useEffect, useRef } from 'react';
import { pinyin as toPinyin } from 'pinyin-pro';
import { useGraphStore } from '../hooks/useGraphStore';
import { useCedict } from '../hooks/useCedict';

const EMPTY_FORM = {
  char: '', pinyin: '', meaning: '',
  isRadical: false, strokes: '', note: '',
};

// Shared field set — pinyin / meaning / strokes / note.
// Used by both the dictionary confirm-stage and the manual-entry form so
// the two paths stay in sync instead of drifting into two field sets.
//
// No radical/primitive checkbox — that used to double as the control for
// node fill color, which is now derived from graph depth instead (see
// src/utils/nodeDepth.js). isRadical still exists on node data (defaults
// false here) since the detail panel's "radical" badge reads it, but it's
// no longer settable from this form.
//
// No discrete tone field — a single tone selector can't represent a
// multi-syllable phrase (东西 has two different tones on two syllables).
// Toned pinyin text (e.g. "dōng xi") carries that instead. Stroke count is
// hidden for phrases too — it's a single-character concept.
function CharacterFields({ form, setForm }) {
  const isPhrase = [...(form.char || '')].length > 1;

  return (
    <div className="modal__fields">
      <div className={`modal__field ${isPhrase ? 'modal__field--full' : ''}`}>
        <label className="modal__label">Pinyin</label>
        <input className="modal__input" type="text" value={form.pinyin}
          onChange={e => setForm(f => ({ ...f, pinyin: e.target.value }))}
          placeholder={isPhrase ? 'toned pinyin per syllable — e.g. dōng xi' : undefined} />
      </div>

      {!isPhrase && (
        <div className="modal__field">
          <label className="modal__label">Stroke count</label>
          <input className="modal__input" type="number" value={form.strokes}
            onChange={e => setForm(f => ({ ...f, strokes: e.target.value }))}
            placeholder="e.g. 8" min={1} max={64} />
        </div>
      )}

      <div className="modal__field modal__field--full">
        <label className="modal__label">Meaning</label>
        <input className="modal__input" type="text" value={form.meaning}
          onChange={e => setForm(f => ({ ...f, meaning: e.target.value }))}
          placeholder="e.g. bright, clear, luminous" />
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
  );
}

export default function AddCharacterModal({ onClose }) {
  const addCharacter = useGraphStore(s => s.addCharacter);
  const nodes         = useGraphStore(s => s.nodes);
  const { searchByPinyin, loading: dictLoading, error: dictError } = useCedict();

  // Characters/phrases already on the canvas — small personal graph, so a
  // plain Set recomputed each render is plenty cheap. Exact-string match
  // only (东 and 东西 are different entries, not "duplicates" of each other).
  const existingChars = new Set(nodes.map(n => n.data.char));

  // ── mode: 'search' (CC-CEDICT lookup) | 'manual' (freeform entry) ───────
  const [mode,     setMode    ] = useState('search');
  // ── stage (search mode only): 'search' | 'confirm' ───────────────────────
  const [stage,    setStage   ] = useState('search');
  const [query,    setQuery   ] = useState('');
  const [results,  setResults ] = useState([]);
  const [form,     setForm    ] = useState(EMPTY_FORM);
  const [error,    setError   ] = useState('');
  const searchRef = useRef(null);
  // Tracks the last pinyin *we* auto-derived, so we can tell "still what we
  // last generated" apart from "the user typed something over it" — only
  // the former gets silently replaced when the character changes again.
  const lastAutoPinyinRef = useRef('');

  const isDuplicate = form.char.trim() !== '' && existingChars.has(form.char.trim());

  // Auto-focus search input on open. The input is disabled while the
  // dictionary is still loading (cedict.json is lazy-loaded on modal open),
  // and .focus() is a no-op on a disabled element — a focus attempt that
  // only ran once on mount was landing before the input became enabled,
  // which is why typing needed a manual click first. Re-running this when
  // dictLoading flips to false covers both that case and the already-cached
  // case (dictLoading starts false, so this still fires immediately then).
  useEffect(() => {
    if (!dictLoading) searchRef.current?.focus();
  }, [dictLoading]);

  // Reset shared state when switching modes so search/manual don't bleed
  // into each other
  useEffect(() => {
    setQuery('');
    setResults([]);
    setError('');
    setForm(EMPTY_FORM);
    lastAutoPinyinRef.current = '';
    if (mode === 'search') setStage('search');
  }, [mode]);

  // Live search as user types — powers both the dictionary search stage
  // and the manual-entry autofill helper
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setResults(searchByPinyin(query));
  }, [query, searchByPinyin]);

  // Auto-derive pinyin in manual mode as you type/paste a character — pure
  // client-side conversion (pinyin-pro), no CC-CEDICT lookup involved, so it
  // works even for characters/phrases the dictionary doesn't have. Only
  // overwrites the field if it's still empty or exactly what we last
  // auto-filled — once you edit it yourself (or the dictionary autofill
  // sets something more authoritative), that value wins and stays put.
  //
  // Deliberately NOT depending on form.pinyin here — this effect is what
  // changes form.pinyin, so depending on it would re-trigger itself. The
  // "did the user already touch this" check just reads the latest
  // form.pinyin via closure at the moment form.char changes.
  useEffect(() => {
    if (mode !== 'manual') return;
    const chars = form.char.trim();
    if (!chars) return;
    if (form.pinyin !== '' && form.pinyin !== lastAutoPinyinRef.current) return;
    const derived = toPinyin(chars, { toneType: 'symbol' });
    if (derived === form.pinyin) return;
    lastAutoPinyinRef.current = derived;
    setForm(f => ({ ...f, pinyin: derived }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.char, mode]);

  function selectCharacter(entry) {
    setForm({
      ...EMPTY_FORM,
      char:    entry.simplified,
      pinyin:  entry.pinyinTone,
      meaning: entry.meanings.slice(0, 3).join(', '),
    });
    setStage('confirm');
    setError('');
  }

  function autofillFromEntry(entry) {
    setForm(f => ({
      ...f,
      char:    entry.simplified,
      pinyin:  entry.pinyinTone,
      meaning: entry.meanings.slice(0, 3).join(', '),
    }));
    setQuery('');
    setResults([]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.char)    { setError('No character selected.');   return; }
    if (!form.pinyin)  { setError('Pinyin is required.');      return; }
    if (!form.meaning) { setError('Meaning is required.');     return; }
    if (isDuplicate && !confirm(`"${form.char}" is already in your graph. Add it as a second entry anyway?`)) {
      return;
    }
    addCharacter({ ...form, strokes: form.strokes ? Number(form.strokes) : null });
    onClose();
  }

  const showTabs = !(mode === 'search' && stage === 'confirm');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* Header */}
        <div className="modal__header">
          <div className="modal__header-left">
            {mode === 'search' && stage === 'confirm' && (
              <button className="modal__back" onClick={() => setStage('search')} aria-label="Back">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <h2 className="modal__title">
              {mode === 'manual'
                ? 'Create character'
                : stage === 'search' ? 'Add character' : 'Confirm character'}
            </h2>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal__body">

          {/* Mode tabs */}
          {showTabs && (
            <div className="modal__mode-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'search'}
                className={`modal__mode-tab ${mode === 'search' ? 'modal__mode-tab--active' : ''}`}
                onClick={() => setMode('search')}
              >
                Search dictionary
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'manual'}
                className={`modal__mode-tab ${mode === 'manual' ? 'modal__mode-tab--active' : ''}`}
                onClick={() => setMode('manual')}
              >
                Create manually
              </button>
            </div>
          )}

          {/* Dict status */}
          {dictLoading && (
            <p className="modal__dict-status modal__dict-status--loading">Loading dictionary…</p>
          )}
          {dictError && (
            <p className="modal__dict-status modal__dict-status--error">
              Dictionary unavailable.<br /><small>{dictError}</small>
            </p>
          )}

          {/* ── Search mode, stage 1: pinyin search ──────────────────────── */}
          {mode === 'search' && stage === 'search' && (
            <div className="modal__search-stage">
              <div className="modal__search-wrap">
                <span className="material-symbols-outlined modal__search-icon">search</span>
                <input
                  ref={searchRef}
                  className="modal__search-input"
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Pinyin, or pinyin + meaning — e.g. yu fish"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={dictLoading}
                />
                {query && (
                  <button className="modal__search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>

              {/* Results grid */}
              {results.length > 0 && (
                <div className="modal__results-grid" role="listbox" aria-label="Matching characters">
                  {results.map(entry => (
                    <button
                      key={entry.simplified}
                      className={`modal__result-card ${existingChars.has(entry.simplified) ? 'modal__result-card--added' : ''}`}
                      onClick={() => selectCharacter(entry)}
                      role="option"
                      title={existingChars.has(entry.simplified) ? 'Already in your graph' : entry.meanings[0]}
                    >
                      {existingChars.has(entry.simplified) && (
                        <span className="result-card__added-badge material-symbols-outlined">check_circle</span>
                      )}
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
                  e.g. <em>ming</em> finds 明, 名, 命…<br />
                  Add a meaning to narrow homophones — <em>yu fish</em> finds 鱼 first.
                </p>
              )}

              {!dictLoading && (
                <p className="modal__search-hint modal__search-hint--footnote">
                  Not in CC-CEDICT? <button type="button" className="modal__link-btn" onClick={() => setMode('manual')}>Create it manually</button>
                </p>
              )}
            </div>
          )}

          {/* ── Search mode, stage 2: confirm + annotate ─────────────────── */}
          {mode === 'search' && stage === 'confirm' && (
            <form className="modal__form" onSubmit={handleSubmit}>
              <div className="modal__char-row">
                <div className="modal__char-input-wrap modal__char-input-wrap--selected">
                  <span className="modal__char-display">{form.char}</span>
                </div>
                <div className="modal__char-selected-meta">
                  <span className="modal__autofill-badge">
                    <span className="material-symbols-outlined">check</span>
                    auto-filled
                  </span>
                  <span className="modal__selected-hint">Edit any field below if needed</span>
                </div>
              </div>

              {isDuplicate && (
                <p className="modal__duplicate-warning">
                  <span className="material-symbols-outlined">info</span>
                  "{form.char}" is already in your graph — adding it again creates a second node.
                </p>
              )}

              <CharacterFields form={form} setForm={setForm} />

              {error && <p className="modal__error">{error}</p>}

              <div className="modal__actions">
                <button type="button" className="modal__btn" onClick={onClose}>Cancel</button>
                <button type="submit" className="modal__btn modal__btn--primary">Add to graph</button>
              </div>
            </form>
          )}

          {/* ── Manual mode: empty form, freeform character ──────────────── */}
          {mode === 'manual' && (
            <form className="modal__form" onSubmit={handleSubmit}>
              <div className="modal__char-row">
                <div className="modal__char-input-wrap">
                  <input
                    className="modal__char-input"
                    type="text"
                    value={form.char}
                    onChange={e => setForm(f => ({ ...f, char: e.target.value }))}
                    placeholder="字"
                    maxLength={12}
                  />
                </div>
                <div className="modal__char-selected-meta">
                  <span className="modal__selected-hint">
                    Type your own character or phrase — e.g. 东西 —<br />
                    or search below to autofill from the dictionary
                  </span>
                </div>
              </div>

              {isDuplicate && (
                <p className="modal__duplicate-warning">
                  <span className="material-symbols-outlined">info</span>
                  "{form.char}" is already in your graph — adding it again creates a second node.
                </p>
              )}

              <div className="modal__manual-search">
                <span className="modal__manual-search-label">Autofill from dictionary (optional)</span>
                <div className="modal__search-wrap">
                  <span className="material-symbols-outlined modal__search-icon">search</span>
                  <input
                    className="modal__search-input"
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                    placeholder="Pinyin, or pinyin + meaning — e.g. yu fish"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={dictLoading}
                  />
                  {query && (
                    <button type="button" className="modal__search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  )}
                </div>
                {/* This search lives inside the outer <form> (see onKeyDown
                    above) so Enter never submits the whole entry while
                    someone's just trying to search for autofill */}
                {results.length > 0 && (
                  <div className="modal__results-grid modal__results-grid--compact" role="listbox" aria-label="Matching characters">
                    {results.map(entry => (
                      <button
                        key={entry.simplified}
                        type="button"
                        className={`modal__result-card ${existingChars.has(entry.simplified) ? 'modal__result-card--added' : ''}`}
                        onClick={() => autofillFromEntry(entry)}
                        role="option"
                        title={existingChars.has(entry.simplified) ? 'Already in your graph' : entry.meanings[0]}
                      >
                        {existingChars.has(entry.simplified) && (
                          <span className="result-card__added-badge material-symbols-outlined">check_circle</span>
                        )}
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
              </div>

              <CharacterFields form={form} setForm={setForm} />

              {error && <p className="modal__error">{error}</p>}

              <div className="modal__actions">
                <button type="button" className="modal__btn" onClick={onClose}>Cancel</button>
                <button type="submit" className="modal__btn modal__btn--primary">Add to graph</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
