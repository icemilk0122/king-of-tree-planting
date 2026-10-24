'use client';

import { useState, useEffect } from 'react';
import { getActiveQuests } from '../../lib/quest-engine';

export default function NearbyQuests({ areaId, onNavigateToQuest, onClose }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getActiveQuests(areaId)
      .then(setQuests)
      .catch((e) => console.warn('Failed to load quests:', e))
      .finally(() => setLoading(false));
  }, [areaId]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>◇ 附近任務</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading && <div style={styles.empty}>載入中…</div>}

        {!loading && quests.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🌿</div>
            <div>這一帶目前沒有任務</div>
            <div style={styles.emptyHint}>到處走走，也許會發現需要關注的樹</div>
          </div>
        )}

        {!loading && quests.length > 0 && (
          <div style={styles.list}>
            {quests.map((q) => (
              <button
                key={q.id}
                style={styles.questCard}
                onClick={() => onNavigateToQuest?.(q)}
              >
                <div style={styles.questTop}>
                  <span style={styles.questType}>
                    {q.quest_type === 'special' ? '★ 特別' : '◇ 一般'}
                  </span>
                  <span style={styles.questPoints}>{q.points} 點</span>
                </div>
                <div style={styles.questTitle}>
                  {q.npc_name || q.title || '近期全樹照'}
                </div>
                <div style={styles.questDesc}>
                  {q.description || '幫我留張全樹照吧。'}
                </div>
              </button>
            ))}
          </div>
        )}

        <div style={styles.footer}>
          共 {quests.length} 個任務
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    background: 'rgba(0,0,0,0.3)',
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    background: 'linear-gradient(180deg, rgba(42,36,30,0.96), rgba(32,28,22,0.98))',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRight: '1px solid rgba(232,93,58,0.3)',
    display: 'flex',
    flexDirection: 'column',
    color: '#FFFCF7',
    paddingTop: 'env(safe-area-inset-top, 0px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 16px 12px',
    borderBottom: '1px solid rgba(232,93,58,0.2)',
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
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  questCard: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(232,93,58,0.25)',
    borderRadius: 14,
    padding: '14px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#FFFCF7',
    transition: 'background 0.15s',
    display: 'block',
    width: '100%',
  },
  questTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  questType: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  questPoints: {
    fontSize: 13,
    fontWeight: 700,
    color: '#5CB8B2',
  },
  questTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 4,
  },
  questDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.5,
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
  },
  footer: {
    padding: '12px 16px',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    borderTop: '1px solid rgba(232,93,58,0.15)',
    textAlign: 'center',
  },
};
