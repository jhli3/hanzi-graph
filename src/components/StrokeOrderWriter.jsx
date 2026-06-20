import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';

export default function StrokeOrderWriter({ char }) {
  const containerRef = useRef(null);
  const writerRef    = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error | animating

  useEffect(() => {
    if (!containerRef.current || !char) return;

    setStatus('loading');

    // Clear any previous writer
    containerRef.current.innerHTML = '';
    writerRef.current = null;

    const writer = HanziWriter.create(containerRef.current, char, {
      width:            180,
      height:           180,
      padding:          12,
      strokeColor:      '#1E1E1C',
      radicalColor:     '#1E1E1C',
      outlineColor:     '#D4D0C8',
      drawingColor:     '#1E1E1C',
      strokeAnimationSpeed: 1,
      delayBetweenStrokes:  200,
      showCharacter:    true,
      showOutline:      true,
      charDataLoader(char, onLoad, onError) {
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`)
          .then(r => {
            if (!r.ok) throw new Error('not found');
            return r.json();
          })
          .then(onLoad)
          .catch(onError);
      },
    });

    writerRef.current = writer;

    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      try {
        writer.hideCharacter({ duration: 0 });
        writer.showCharacter({ duration: 0 });
        clearInterval(poll);
        setStatus('ready');
      } catch {
        // still loading
      }
      if (attempts > 40) {
        clearInterval(poll);
        setStatus('error');
      }
    }, 100);

    return () => {
      clearInterval(poll);
      if (containerRef.current) containerRef.current.innerHTML = '';
      writerRef.current = null;
    };
  }, [char]);

  function handleAnimate() {
    if (!writerRef.current || status === 'animating') return;
    setStatus('animating');
    writerRef.current.animateCharacter({
      onComplete: () => setStatus('ready'),
    });
  }

  function handleReplay() {
    if (!writerRef.current) return;
    writerRef.current.hideCharacter({ duration: 0 });
    setTimeout(() => {
      setStatus('animating');
      writerRef.current.animateCharacter({
        onComplete: () => setStatus('ready'),
      });
    }, 50);
  }

  return (
    <div className="stroke-writer">
      <div className="stroke-writer__canvas-wrap">
        <div ref={containerRef} className="stroke-writer__canvas" />
        {status === 'loading' && (
          <div className="stroke-writer__overlay">loading…</div>
        )}
        {status === 'error' && (
          <div className="stroke-writer__overlay stroke-writer__overlay--error">
            no stroke data
          </div>
        )}
      </div>

      {(status === 'ready' || status === 'animating') && (
        <div className="stroke-writer__controls">
          {status === 'ready' && (
            <button className="stroke-writer__btn" onClick={handleAnimate}>
              ▶ animate
            </button>
          )}
          {status === 'animating' && (
            <button className="stroke-writer__btn stroke-writer__btn--muted" disabled>
              animating…
            </button>
          )}
          <button
            className="stroke-writer__btn stroke-writer__btn--ghost"
            onClick={handleReplay}
            disabled={status === 'animating'}
            title="Replay"
          >
            ↺
          </button>
        </div>
      )}
    </div>
  );
}
