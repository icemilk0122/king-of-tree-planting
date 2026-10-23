'use client';

import { DISTRICTS } from '../../lib/districts';

const DISTRICT_LAYOUT = [
  [null, 'beitou', null, null],
  [null, 'shilin', 'neihu', null],
  ['datong', 'zhongshan', 'songshan', 'nangang'],
  ['wanhua', 'zhongzheng', 'daan', 'xinyi'],
  [null, null, 'wenshan', null],
];

export default function DistrictMap({ onTeleport, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>🗺️ 台北市地圖傳送</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.hint}>點選行政區快速移動</div>
        <div style={styles.grid}>
          {DISTRICT_LAYOUT.map((row, ri) => (
            <div key={ri} style={styles.row}>
              {row.map((key, ci) => {
                if (!key) return <div key={ci} style={styles.emptyCell} />;
                const d = DISTRICTS[key];
                return (
                  <button
                    key={key}
                    style={styles.cell}
                    onClick={() => {
                      onTeleport?.(d.lat, d.lng, key);
                      onClose();
                    }}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 55,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 440,
    background: 'linear-gradient(135deg, rgba(30,50,30,0.95), rgba(20,35,20,0.98))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '2px solid rgba(80,140,80,0.4)',
    borderRadius: 20,
    padding: 20,
    color: '#e8f0e8',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  hint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  row: {
    display: 'flex',
    gap: 6,
  },
  emptyCell: {
    flex: 1,
    minHeight: 48,
  },
  cell: {
    flex: 1,
    minHeight: 48,
    background: 'rgba(46,125,50,0.3)',
    border: '1px solid rgba(76,175,80,0.35)',
    borderRadius: 12,
    color: '#c8e6c9',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, transform 0.1s',
  },
};
