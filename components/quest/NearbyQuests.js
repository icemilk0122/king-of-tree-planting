'use client';

import { useState, useEffect } from 'react';
import { getActiveQuests } from '../../lib/quest-engine';
import {
  createNpcNavigationTarget,
  getDefaultNearbyQuests,
  getNpcPlacementsForDistrict,
  mergeNearbyNpcQuests,
} from '../../lib/npc-placements';

export default function NearbyQuests({ areaId, onNavigateToQuest, onNavigateToStory, onClose }) {
  const [quests, setQuests] = useState(() => getDefaultNearbyQuests(areaId));
  const [loading, setLoading] = useState(true);
  const stories = getNpcPlacementsForDistrict(areaId);

  useEffect(() => {
    setQuests(getDefaultNearbyQuests(areaId));
    setLoading(true);
    getActiveQuests(areaId)
      .then(activeQuests => setQuests(mergeNearbyNpcQuests(activeQuests, areaId)))
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

        <div style={styles.content}>
          {stories.length > 0 && (
            <section style={styles.section} aria-labelledby="nearby-stories-heading">
              <div style={styles.sectionHeading}>
                <span id="nearby-stories-heading">街區故事</span>
                <small style={styles.sectionHint}>前往角色身邊開始對話</small>
              </div>
              <div style={styles.storyList}>
                {stories.map(npc => (
                  <button
                    key={npc.id}
                    style={styles.storyCard}
                    onClick={() => onNavigateToStory?.(createNpcNavigationTarget(npc))}
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
            </section>
          )}

          <section style={styles.section} aria-labelledby="nearby-tree-quests-heading">
            <div style={styles.sectionHeading}>
              <span id="nearby-tree-quests-heading">樹木任務</span>
              {!loading && <small style={styles.sectionHint}>{quests.length} 個可進行</small>}
            </div>

            {loading && quests.length === 0 && <div style={styles.loading}>正在尋找附近任務…</div>}

            {!loading && quests.length === 0 && (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>🌿</div>
                <div>這一帶目前沒有樹木任務</div>
                <div style={styles.emptyHint}>
                  {stories.length > 0 ? '仍可以前往上方的街區故事' : '換個行政區走走看吧'}
                </div>
              </div>
            )}

            {quests.length > 0 && (
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
          </section>
        </div>

        <div style={styles.footer}>
          共 {stories.length + quests.length} 個任務與故事
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
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    padding: '0 4px 8px',
    color: '#FFC56D',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.1em',
  },
  sectionHint: {
    color: 'rgba(255,252,247,0.45)',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: 0,
  },
  storyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  storyCard: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    color: '#FFFCF7',
    background: 'rgba(255,183,77,0.11)',
    border: '1px solid rgba(255,183,77,0.42)',
    borderRadius: 13,
    padding: '11px 12px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  storyIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 36,
    height: 36,
    flex: '0 0 36px',
    borderRadius: 11,
    background: 'rgba(255,197,109,0.18)',
    fontSize: 18,
  },
  storyCopy: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,
    fontSize: 14,
  },
  storyArrow: {
    color: '#FFC56D',
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  list: {
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
  loading: {
    padding: '22px 12px',
    textAlign: 'center',
    color: 'rgba(255,252,247,0.5)',
    fontSize: 13,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    padding: '22px 16px 6px',
  },
  emptyIcon: {
    fontSize: 30,
    marginBottom: 4,
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
