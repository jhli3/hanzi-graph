// Color math backing the depth-based node gradient (see nodeDepth.js):
// background lightening (skewed toward white, see easeLighter) and text
// colors guaranteed to stay readable against whatever background results.

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToCss({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

// Linearly interpolates between two "#RRGGBB" colors, returning {r,g,b}.
export function lerpRgb(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

// Biases an interpolation factor toward its lighter/higher end — t=0 and
// t=1 are unchanged (root stays pure black, the deepest node stays pure
// white), but anything past a shallow depth already reads mostly white
// with just a subtle grey tint, instead of grinding evenly through the
// mid-tones. gamma > 1 = more skew.
export function easeLighter(t, gamma) {
  return 1 - Math.pow(1 - t, gamma);
}

// ── WCAG contrast ────────────────────────────────────────────────────────
function relativeLuminance({ r, g, b }) {
  const linear = c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(rgbA, rgbB) {
  const la = relativeLuminance(rgbA);
  const lb = relativeLuminance(rgbB);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function luminanceToGray(luminance) {
  const clamped = Math.max(0, Math.min(1, luminance));
  const s = clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  const v = Math.round(Math.max(0, Math.min(1, s)) * 255);
  return { r: v, g: v, b: v };
}

// A neutral grey guaranteed to hit `targetContrast` against `bgRgb`, solved
// directly from the background's actual luminance. Only ~4.583:1 is
// achievable this way against an arbitrary background — above that there's
// a real mid-tone band where neither black nor white text can reach the
// target — so callers should keep targetContrast comfortably under that.
function contrastingGray(bgRgb, targetContrast) {
  const bgLum = relativeLuminance(bgRgb);
  const darkLum = (bgLum + 0.05) / targetContrast - 0.05;
  if (darkLum >= 0) return luminanceToGray(darkLum);
  const lightLum = targetContrast * (bgLum + 0.05) - 0.05;
  return luminanceToGray(lightLum);
}

// Picks a text color for `bgRgb`: whichever of the two hand-tuned
// root/leaf variants already clears `targetContrast` (so the original,
// slightly warm-tinted colors are kept intact right where they were tuned
// for — near the pure-black and pure-white ends of the gradient), falling
// back to a directly-solved neutral grey only in the mid-gradient zone
// where neither original variant is contrasty enough on its own. This is
// what avoids the "grey text on grey background" dead zone that naively
// interpolating text and background by the same factor produces.
export function readableTextColor(bgRgb, rootHex, leafHex, targetContrast) {
  const rootRgb = hexToRgb(rootHex);
  const leafRgb = hexToRgb(leafHex);
  const cRoot = contrastRatio(rootRgb, bgRgb);
  const cLeaf = contrastRatio(leafRgb, bgRgb);
  const best = cRoot >= cLeaf ? rootRgb : leafRgb;
  if (Math.max(cRoot, cLeaf) >= targetContrast) return best;
  return contrastingGray(bgRgb, targetContrast);
}
