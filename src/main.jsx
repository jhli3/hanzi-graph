import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Self-hosted Noto Serif SC (chinese-simplified subset only — the modal/nodes
// never render Latin text in this font). Google's own CDN was the actual
// source of the "some characters render in the wrong font" bug: it splits
// large CJK families into dozens of unicode-range-scoped files and fetches
// each lazily on first use, so any character that hadn't been rendered yet
// briefly shows in a fallback sans font while its chunk downloads — exactly
// what showed up in the search results grid for rarer characters. This is a
// single ~1.5MB file with no internal unicode-range splitting, so the whole
// subset loads once, up front, with nothing left to race. Only the 400
// (regular) weight is loaded — nothing in the app renders CJK text bold.
import '@fontsource/noto-serif-sc/chinese-simplified-400.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
