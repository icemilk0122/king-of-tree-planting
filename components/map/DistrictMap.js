'use client';

import { DISTRICTS } from '../../lib/districts';
import { NPC_PLACEMENTS } from '../../lib/npc-placements';

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
        <div style={styles.storySection}>
          <div style={styles.storyEyebrow}>街區故事</div>
          {NPC_PLACEMENTS.map(npc => (
            <button
              key={npc.id}
              style={styles.storyCell}
              onClick={() => {
                onTeleport?.(npc.arrivalLat, npc.arrivalLng, npc.districtKey);
                onClose();
              }}
            >
              <span style={styles.storyIcon}>{npc.mapIcon || '💬'}</span>
              <span style={styles.storyCopy}>
                <strong>{npc.name}</strong>
                <small>{npc.locationLabel}</small>
              </span>
              <span style={styles.storyArrow}>前往 →</span>
            </button>
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
    background: 'linear-gradient(135deg, rgba(42,36,30,0.95), rgba(32,28,22,0.98))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '2px solid rgba(232,93,58,0.4)',
    borderRadius: 20,
    padding: 20,
    color: '#FFFCF7',
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
    background: 'rgba(232,93,58,0.3)',
    border: '1px solid rgba(232,93,58,0.35)',
    borderRadius: 12,
    color: '#FFFCF7',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, transform 0.1s',
  },
  storySection: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.12)',
  },
  storyEyebrow: {
    marginBottom: 9,
    color: '#FFC56D',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.12em',
  },
  storyCell: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    color: '#2A241E',
    background: '#FFF1CB',
    border: '2px solid #FFB74D',
    borderRadius: 14,
    padding: '11px 13px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  storyIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 36,
    height: 36,
    flex: '0 0 36px',
    borderRadius: 12,
    background: '#FFD78C',
    fontSize: 18,
  },
  storyCopy: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 2,
    fontSize: 14,
  },
  storyArrow: {
    color: '#B34228',
    fontSize: 12,
    fontWeight: 800,
  },
};
