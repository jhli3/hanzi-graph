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

  // TEMP DEBUG — remove after
  console.log('yu index entries:', index.get('yu')?.map(e => e.simplified));
  console.log('鱼 in dict:', dict.get('鱼'));
  return index;
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

  const searchByPinyin = useCallback((query, limit = 200) => {
    if (!cachedPinyin || !query.trim()) return [];
    const key     = normalise(query);
    const matches = cachedPinyin.get(key) ?? [];
    return matches
      .slice()
      .sort((a, b) => {
        // Single characters always sort before compounds
        const aLen = [...a.simplified].length;
        const bLen = [...b.simplified].length;
        if (aLen !== bLen) return aLen - bLen;
        return 0;
      })
      .slice(0, limit);
  }, []);

  return { lookup, lookupMany, searchByPinyin, loading, error};
}