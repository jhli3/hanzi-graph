// src/hooks/useCedict.js

import { useState, useEffect, useCallback } from 'react';

let cachedDict   = null;  // Map<simplified, entry>
let cachedPinyin = null;  // Map<pinyinBase, entry[]>
let fetchPromise = null;

// Strip tone diacritics + numbers → bare syllable for matching
// "míng" → "ming",  "ming2" → "ming",  "yú" → "yu"
function normalise(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .replace(/[0-9]/g, '')           // strip numeric tones
    .replace(/u:/g, 'u')             // CC-CEDICT alternate ü spelling
    .trim();
}

function buildPinyinIndex(dict) {
  const index = new Map();
  for (const entry of dict.values()) {
    // Index on the first syllable's bare form only (single-char lookup)
    // e.g. "míng bai" → key "ming" so compounds don't pollute single-char results
    const firstSyllable = entry.pinyinTone.split(/\s+/)[0];
    const key = normalise(firstSyllable);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(entry);
  }
  return index;
}

// Escape a string for safe use inside a RegExp
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Score how well an entry's meanings match a set of free-text definition
// terms — used to disambiguate homophones (e.g. "yu fish" → 鱼 over 渔/余).
// A whole-word match counts more than a bare substring, and a match in the
// entry's first (most common) sense counts more than one further down.
function scoreMeanings(entry, terms) {
  let score = 0;
  entry.meanings.forEach((meaning, idx) => {
    const lower = meaning.toLowerCase();
    const positionWeight = idx === 0 ? 1.5 : 1;
    for (const term of terms) {
      if (!term) continue;
      const boundary = new RegExp(`\\b${escapeRegExp(term)}\\b`);
      if (boundary.test(lower)) score += 2 * positionWeight;
      else if (lower.includes(term)) score += 1 * positionWeight;
    }
  });
  return score;
}

async function loadDict() {
  if (cachedDict) return cachedDict;
  if (!fetchPromise) {
    fetchPromise = fetch(`${import.meta.env.BASE_URL}cedict.json`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load cedict.json (${r.status})`);
        return r.json();
      })
      .then(obj => {
        cachedDict   = new Map(Object.entries(obj));
        cachedPinyin = buildPinyinIndex(cachedDict);
        return cachedDict;
      });
  }
  return fetchPromise;
}

export function useCedict() {
  const [loading, setLoading] = useState(!cachedDict);
  const [error,   setError  ] = useState(null);

  useEffect(() => {
    if (cachedDict) return;
    setLoading(true);
    loadDict()
      .then(() => setLoading(false))
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const lookup = useCallback((char) => {
    if (!cachedDict || !char) return null;
    if (cachedDict.has(char)) return cachedDict.get(char);
    if (char.length > 1 && cachedDict.has(char[0])) return cachedDict.get(char[0]);
    return null;
  }, []);

  const lookupMany = useCallback((chars) => {
    return chars.map(char => ({ char, entry: lookup(char) }));
  }, [lookup]);

  // Smart search: first word is always the pinyin key (bare syllable,
  // tones optional — unchanged from before). Any words after that are
  // treated as definition keywords, e.g. "yu fish" narrows the "yu"
  // homophones down to the fish-shaped one. If none of the candidates'
  // meanings match the definition terms, we fall back to the full pinyin
  // list rather than going empty — better a loose result than none.
  const searchByPinyin = useCallback((query, limit = 200) => {
    if (!cachedPinyin || !query.trim()) return [];
    const words      = query.trim().split(/\s+/);
    const pinyinKey  = normalise(words[0]);
    const defTerms   = words.slice(1).map(w => w.toLowerCase()).filter(Boolean);
    const candidates = cachedPinyin.get(pinyinKey) ?? [];

    let scored = candidates.map(entry => ({
      entry,
      hits: defTerms.length ? scoreMeanings(entry, defTerms) : 0,
    }));

    if (defTerms.length > 0) {
      const withHits = scored.filter(s => s.hits > 0);
      if (withHits.length > 0) scored = withHits;
    }

    return scored
      .sort((a, b) => {
        if (b.hits !== a.hits) return b.hits - a.hits;
        // Single characters sort before compounds
        const aLen = [...a.entry.simplified].length;
        const bLen = [...b.entry.simplified].length;
        return aLen - bLen;
      })
      .slice(0, limit)
      .map(s => s.entry);
  }, []);

  return { lookup, lookupMany, searchByPinyin, loading, error};
}