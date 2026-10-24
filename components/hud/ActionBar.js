'use client';

import styles from './ActionBar.module.css';

export function NearbyQuestCoachmark({ mobile = false, onDismiss }) {
  return (
    <div
      className={`${styles.coachmark} ${mobile ? styles.mobileCoachmark : ''}`}
      role="status"
      aria-live="polite"
    >
      <span>從這裡打開附近任務</span>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={onDismiss}
        aria-label="關閉附近任務提示"
      >×</button>
    </div>
  );
}

export default function ActionBar({
  onNearbyQuests,
  onHeritageGuide,
  onPhotoReport,
  onPlantTree,
  onMap,
  hideMobileNav = false,
  showNearbyQuestHint = false,
  onDismissNearbyQuestHint,
}) {
  return (
    <div style={{
      ...inlineStyles.bar,
      ...(hideMobileNav ? { justifyContent: 'flex-end' } : {}),
    }}>
      {!hideMobileNav && (
        <div style={inlineStyles.left}>
          <div className={styles.nearbyAnchor}>
            {showNearbyQuestHint && (
              <NearbyQuestCoachmark onDismiss={onDismissNearbyQuestHint} />
            )}
            <button type="button" style={inlineStyles.btn} onClick={onNearbyQuests}>
              <span style={inlineStyles.icon}>❗</span>
              <span style={inlineStyles.label}>附近任務</span>
            </button>
          </div>
          <button type="button" style={inlineStyles.btn} onClick={onHeritageGuide}>
            <span style={inlineStyles.icon}>🌳</span>
            <span style={inlineStyles.label}>老樹圖鑑</span>
          </button>
          <button type="button" style={inlineStyles.btn} onClick={onMap}>
            <span style={inlineStyles.icon}>🗺️</span>
            <span style={inlineStyles.label}>地圖</span>
          </button>
        </div>
      )}
      <div style={inlineStyles.right}>
        <button type="button" style={{ ...inlineStyles.btn, ...inlineStyles.primaryBtn }} onClick={onPhotoReport}>
          <span style={inlineStyles.icon}>📸</span>
          <span style={inlineStyles.label}>拍照回報</span>
        </button>
        <button type="button" style={{ ...inlineStyles.btn, ...inlineStyles.secondaryBtn }} onClick={onPlantTree}>
          <span style={inlineStyles.icon}>🌱</span>
          <span style={inlineStyles.label}>建議種樹</span>
        </button>
      </div>
    </div>
  );
}

const inlineStyles = {
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
