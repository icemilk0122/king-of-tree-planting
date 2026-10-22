'use client';

import { useEffect, useRef } from 'react';
import { initGame } from '../lib/engine';

export default function Game() {
  const containerRef = useRef(null);
  const coordRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = initGame(containerRef.current, coordRef.current);

    return () => {
      if (gameRef.current?.cleanup) {
        gameRef.current.cleanup();
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
      <div style={styles.hud}>
        <div style={styles.title}>King of Tree Planting</div>
        <div ref={coordRef} style={styles.coord}>25.0330, 121.5654</div>
      </div>
      <div style={styles.controls}>
        WASD / Arrow Keys: Move &nbsp; Q/E: Rotate Camera &nbsp; Scroll: Zoom
      </div>
    </>
  );
}

const styles = {
  hud: {
    position: 'fixed',
    top: 16,
    left: 16,
    color: '#fff',
    fontSize: 14,
    background: 'rgba(0,0,0,0.6)',
    padding: '12px 16px',
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
    lineHeight: 1.6,
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },
  coord: {
    fontVariantNumeric: 'tabular-nums',
    opacity: 0.8,
  },
  controls: {
    position: 'fixed',
    bottom: 16,
    left: 16,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    zIndex: 10,
    background: 'rgba(0,0,0,0.4)',
    padding: '8px 12px',
    borderRadius: 8,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    fontFamily: 'system-ui, sans-serif',
  },
};
