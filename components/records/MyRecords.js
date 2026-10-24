'use client';

import { useState, useEffect } from 'react';
import { getUserStats, getLeaderboard } from '../../lib/quest-engine';
import RelayTab from './RelayTab';

export default function MyRecords({ onClose, areaId }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, lb] = await Promise.all([getUserStats(), getLeaderboard()]);
        setStats(s);
        setLeaderboard(lb);
      } catch (e) {
        console.warn('Failed to load records:', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>🏆 我的紀錄</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'stats' ? styles.tabActive : {}) }}
            onClick={() => setTab('stats')}
          >
            個人
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'leaderboard' ? styles.tabActive : {}) }}
            onClick={() => setTab('leaderboard')}
          >
            排行榜
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'relay' ? styles.tabActive : {}) }}
            onClick={() => setTab('relay')}
          >
            社區接力
          </button>
        </div>

        {loading && <div style={styles.empty}>載入中…</div>}

        {!loading && tab === 'stats' && stats && (
          <div style={styles.content}>
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.totalPoints}</div>
                <div style={styles.statLabel}>護樹點</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>
                  {stats.participations.filter((p) => p.status === 'submitted').length}
                </div>
                <div style={styles.statLabel}>完成任務</div>
              </div>
            </div>

            <div style={styles.sectionTitle}>近期活動</div>
            {stats.participations.length === 0 && (
              <div style={styles.emptyHint}>還沒有任務紀錄，去探索吧！</div>
            )}
            {stats.participations.map((p) => (
              <div key={p.id} style={styles.activityCard}>
                <div style={styles.activityTop}>
                  <span style={styles.activityType}>
                    {p.quests?.quest_type === 'special' ? '★' : '◇'}
                  </span>
                  <span style={styles.activityTitle}>
                    {p.quests?.npc_name || p.quests?.title || '任務'}
                  </span>
                  <span style={styles.activityStatus}>
                    {p.status === 'submitted' ? '✅' : '⏳'}
                  </span>
                </div>
                {p.photo_url && (
                  <img src={p.photo_url} alt="" style={styles.activityPhoto} />
                )}
                {p.comment && (
                  <div style={styles.activityComment}>{p.comment}</div>
                )}
                <div style={styles.activityDate}>
                  {new Date(p.created_at).toLocaleDateString('zh-TW')}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'leaderboard' && (
          <div style={styles.content}>
            {leaderboard.map((u, i) => (
              <div key={u.id} style={styles.lbRow}>
                <span style={styles.lbRank}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span style={styles.lbName}>{u.display_name}</span>
                <span style={styles.lbPoints}>{u.total_points} 點</span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div style={styles.emptyHint}>還沒有人上榜，成為第一位吧！</div>
            )}
          </div>
        )}

        {tab === 'relay' && (
          <div style={styles.content}>
            <RelayTab areaId={areaId} />
          </div>
        )}
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
    justifyContent: 'flex-end',
    background: 'rgba(0,0,0,0.3)',
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    background: 'linear-gradient(180deg, rgba(42,36,30,0.96), rgba(32,28,22,0.98))',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderLeft: '1px solid rgba(232,93,58,0.3)',
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
  tabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid rgba(232,93,58,0.2)',
  },
  tab: {
    flex: 1,
    padding: '12px',
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    textAlign: 'center',
  },
  tabActive: {
    color: '#F07B5E',
    borderBottomColor: '#E85D3A',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  statsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(232,93,58,0.2)',
    borderRadius: 14,
    padding: '16px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#5CB8B2',
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  activityCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(232,93,58,0.15)',
    borderRadius: 12,
    padding: '12px 14px',
    marginBottom: 8,
  },
  activityTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  activityType: {
    fontSize: 14,
  },
  activityTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
  },
  activityStatus: {
    fontSize: 16,
  },
  activityPhoto: {
    width: '100%',
    borderRadius: 8,
    maxHeight: 160,
    objectFit: 'cover',
    marginBottom: 6,
  },
  activityComment: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    padding: 32,
  },
  emptyHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    padding: '20px 0',
  },
  lbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(232,93,58,0.12)',
    borderRadius: 12,
    marginBottom: 6,
  },
  lbRank: {
    fontSize: 18,
    width: 32,
    textAlign: 'center',
    flexShrink: 0,
  },
  lbName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 600,
  },
  lbPoints: {
    fontSize: 14,
    fontWeight: 700,
    color: '#5CB8B2',
    fontVariantNumeric: 'tabular-nums',
  },
};
