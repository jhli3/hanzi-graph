// Estimates a font-size (px) that lets `char` fit on one line within
// `maxWidth` px, without measuring actual rendered text — CJK characters are
// roughly monospace/square, so length × font-size ≈ rendered width holds
// closely enough. Single characters always get `max`; longer phrases shrink
// toward `min` as they run out of room, clamped so they never get smaller
// than `min` (a phrase long enough can still overflow slightly at that
// floor — a known tradeoff in favor of staying legible).
export function charFontSize(char, { min, max, maxWidth }) {
  const len = [...(char || '')].length;
  if (len <= 1) return max;
  const fit = Math.floor(maxWidth / len);
  return Math.max(min, Math.min(max, fit));
}
