'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initGame } from '../lib/engine';

export default function Game() {
  const containerRef = useRef(null);
  const coordRef = useRef(null);
  const treeInfoRef = useRef(null);
  const gameRef = useRef(null);
  const [selectedTree, setSelectedTree] = useState(null);
  const [weather, setWeather] = useState(null);

  const onTreeClick = useCallback((data) => {
    setSelectedTree(data);
  }, []);

  const onWeatherUpdate = useCallback((data) => {
    setWeather(data);
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = initGame(
      containerRef.current, coordRef.current, treeInfoRef.current,
      onTreeClick, onWeatherUpdate
    );

    return () => {
      if (gameRef.current?.cleanup) {
        gameRef.current.cleanup();
        gameRef.current = null;
      }
    };
  }, [onTreeClick, onWeatherUpdate]);

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
      <div style={styles.hud}>
        <div style={styles.title}>King of Tree Planting</div>
        <div ref={coordRef} style={styles.coord}>25.0330, 121.5654</div>
      </div>

      {weather && (
        <div style={styles.weatherHud}>
          <div style={styles.weatherIcon}>{weather.icon}</div>
          <div>
            <div style={styles.weatherTemp}>{weather.temp}°C</div>
            <div style={styles.weatherLabel}>{weather.label}</div>
          </div>
        </div>
      )}

      <div ref={treeInfoRef} style={styles.treeInfo} />
      <div style={styles.controls}>
        WASD / Arrow Keys: Move &nbsp; Q/E: Rotate Camera &nbsp; Scroll: Zoom
      </div>

      {selectedTree && (
        <div style={styles.cardOverlay} onClick={() => setSelectedTree(null)}>
          <div style={styles.card} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setSelectedTree(null)}>✕</button>
            <div style={styles.cardIcon}>🌳</div>
            <div style={styles.cardTitle}>{selectedTree.species}</div>
            <div style={styles.cardGrid}>
              <div style={styles.cardLabel}>胸徑</div>
              <div style={styles.cardValue}>{selectedTree.diameter} cm</div>
              <div style={styles.cardLabel}>樹高</div>
              <div style={styles.cardValue}>{selectedTree.height} m</div>
              <div style={styles.cardLabel}>樹木編號</div>
              <div style={styles.cardValue}>{selectedTree.treeId || '—'}</div>
            </div>
          </div>
        </div>
      )}
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
  weatherHud: {
    position: 'fixed',
    top: 16,
    right: 16,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(0,0,0,0.6)',
    padding: '10px 16px',
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
    fontFamily: 'system-ui, sans-serif',
  },
  weatherIcon: {
    fontSize: 32,
    lineHeight: 1,
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  weatherLabel: {
    fontSize: 13,
    opacity: 0.8,
  },
  treeInfo: {
    position: 'fixed',
    bottom: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    background: 'rgba(30, 70, 30, 0.85)',
    padding: '10px 20px',
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
    fontFamily: 'system-ui, sans-serif',
    transition: 'opacity 0.3s',
    opacity: 0,
    whiteSpace: 'nowrap',
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
  cardOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)',
  },
  card: {
    position: 'relative',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 20,
    padding: '28px 32px 24px',
    minWidth: 260,
    maxWidth: 320,
    textAlign: 'center',
    fontFamily: 'system-ui, sans-serif',
    color: '#1a1a1a',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 14,
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#888',
    lineHeight: 1,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 16,
    color: '#2e7d32',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '8px 16px',
    textAlign: 'left',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 500,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 600,
  },
};
