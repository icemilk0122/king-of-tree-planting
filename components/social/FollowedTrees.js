'use client';

import { useState, useEffect } from 'react';
import { getFollowedTrees, toggleFollowTree } from '../../lib/quest-engine';

export default function FollowedTrees({ onClose }) {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFollowedTrees()
      .then(setTrees)
      .catch((e) => console.warn('Failed to load followed trees:', e))
      .finally(() => setLoading(false));
  }, []);

  async function handleUnfollow(treeId) {
    await toggleFollowTree(treeId);
    setTrees((prev) => prev.filter((t) => t.tree_id !== treeId));
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>❤️ 我關心的樹</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading && <div style={styles.empty}>載入中…</div>}

        {!loading && trees.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🌳</div>
            <div>還沒有關注任何樹</div>
            <div style={styles.emptyHint}>點擊樹木對話後選「加入關注」</div>
          </div>
        )}

        {!loading && trees.length > 0 && (
          <div style={styles.list}>
            {trees.map((t) => (
              <div key={t.tree_id} style={styles.card}>
                <div style={styles.cardLeft}>
                  <span style={styles.cardIcon}>🌳</span>
                  <div>
                    <div style={styles.cardId}>{t.tree_id}</div>
                    <div style={styles.cardDate}>
                      關注於 {new Date(t.created_at).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </div>
                <button
                  style={styles.unfollowBtn}
                  onClick={() => handleUnfollow(t.tree_id)}
                >
                  取消
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.footer}>
          共關注 {trees.length} 棵樹
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
    justifyContent: 'flex-end',
    background: 'rgba(0,0,0,0.3)',
  },
  panel: {
    width: '100%',
    maxWidth: 360,
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
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(232,93,58,0.2)',
    borderRadius: 14,
    padding: '12px 16px',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardId: {
    fontSize: 14,
    fontWeight: 600,
  },
  cardDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  unfollowBtn: {
    background: 'rgba(239,83,80,0.2)',
    border: '1px solid rgba(239,83,80,0.3)',
    borderRadius: 8,
    color: '#ef5350',
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 12px',
    cursor: 'pointer',
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
