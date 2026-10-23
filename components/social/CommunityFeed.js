'use client';

import { useState, useEffect } from 'react';
import { getCommunityFeed } from '../../lib/quest-engine';

const EVENT_LABELS = {
  photo_submitted: { icon: '📸', label: '提交了照片' },
  tree_followed: { icon: '❤️', label: '關注了一棵樹' },
  proposal_created: { icon: '🌱', label: '建議種樹' },
};

export default function CommunityFeed({ areaId, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommunityFeed(areaId)
      .then(setEvents)
      .catch((e) => console.warn('Failed to load feed:', e))
      .finally(() => setLoading(false));
  }, [areaId]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>📢 社區近況</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading && <div style={styles.empty}>載入中…</div>}

        {!loading && events.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🏘️</div>
            <div>這個社區還沒有動態</div>
            <div style={styles.emptyHint}>成為第一個行動的人吧</div>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div style={styles.list}>
            {events.map((e) => {
              const info = EVENT_LABELS[e.event_type] || { icon: '📌', label: e.event_type };
              return (
                <div key={e.id} style={styles.card}>
                  <span style={styles.eventIcon}>{info.icon}</span>
                  <div style={styles.eventBody}>
                    <div style={styles.eventText}>
                      <strong>{e.users?.display_name || '探索者'}</strong> {info.label}
                    </div>
                    <div style={styles.eventTime}>
                      {new Date(e.created_at).toLocaleString('zh-TW', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
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
    justifyContent: 'flex-start',
    background: 'rgba(0,0,0,0.3)',
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    background: 'linear-gradient(180deg, rgba(25,45,25,0.96), rgba(18,32,18,0.98))',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRight: '1px solid rgba(80,140,80,0.3)',
    display: 'flex',
    flexDirection: 'column',
    color: '#e8f0e8',
    paddingTop: 'env(safe-area-inset-top, 0px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 16px 12px',
    borderBottom: '1px solid rgba(80,140,80,0.2)',
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
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 0',
    borderBottom: '1px solid rgba(80,140,80,0.1)',
  },
  eventIcon: {
    fontSize: 20,
    flexShrink: 0,
    marginTop: 2,
  },
  eventBody: {
    flex: 1,
  },
  eventText: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  eventTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
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
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyHint: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
};
