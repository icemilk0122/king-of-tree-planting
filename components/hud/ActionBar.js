'use client';

export default function ActionBar({ onNearbyQuests, onPhotoReport, onPlantTree, onMap, onRecords }) {
  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <button style={styles.btn} onClick={onNearbyQuests}>
          <span style={styles.icon}>❗</span>
          <span style={styles.label}>附近任務</span>
        </button>
        <button style={styles.btn} onClick={onMap}>
          <span style={styles.icon}>🗺️</span>
          <span style={styles.label}>地圖</span>
        </button>
      </div>
      <div style={styles.right}>
        <button style={{ ...styles.btn, ...styles.primaryBtn }} onClick={onPhotoReport}>
          <span style={styles.icon}>📸</span>
          <span style={styles.label}>拍照回報</span>
        </button>
        <button style={{ ...styles.btn, ...styles.secondaryBtn }} onClick={onPlantTree}>
          <span style={styles.icon}>🌱</span>
          <span style={styles.label}>建議種樹</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px calc(8px + env(safe-area-inset-bottom, 0px))',
    background: 'linear-gradient(transparent, rgba(42,36,30,0.7))',
    zIndex: 10,
    gap: 8,
  },
  left: {
    display: 'flex',
    gap: 6,
  },
  right: {
    display: 'flex',
    gap: 6,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(42,36,30,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(232,93,58,0.2)',
    borderRadius: 12,
    color: '#FFFCF7',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 14px',
    whiteSpace: 'nowrap',
    minHeight: 44,
  },
  primaryBtn: {
    background: 'rgba(232,93,58,0.85)',
    borderColor: 'rgba(232,93,58,0.5)',
  },
  secondaryBtn: {
    background: 'rgba(92,184,178,0.7)',
    borderColor: 'rgba(92,184,178,0.4)',
  },
  icon: {
    fontSize: 16,
    lineHeight: 1,
  },
  label: {
    fontSize: 13,
  },
};
