'use client';

import { useState, useEffect } from 'react';
import { getRelayChains, getRelayLegs, pickUpRelay } from '../../lib/quest-engine';

export default function RelayTab({ areaId }) {
  const [chains, setChains] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [legs, setLegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    loadChains();
  }, [areaId]);

  async function loadChains() {
    setLoading(true);
    try {
      const data = await getRelayChains(areaId);
      setChains(data);
    } catch (e) {
      console.warn('Failed to load relays:', e);
    }
    setLoading(false);
  }

  async function toggleExpand(chainId) {
    if (expanded === chainId) {
      setExpanded(null);
      return;
    }
    setExpanded(chainId);
    try {
      const data = await getRelayLegs(chainId);
      setLegs(data);
    } catch (e) {
      console.warn('Failed to load legs:', e);
    }
  }

  async function handlePickUp(chainId) {
    setActionMsg('');
    try {
      await pickUpRelay(chainId);
      setActionMsg('接棒成功！去幫這棵樹拍照吧 📸');
      loadChains();
    } catch (e) {
      setActionMsg(e.message || '接棒失敗');
    }
  }

  if (loading) return <div style={s.empty}>載入中…</div>;

  if (chains.length === 0) {
    return (
      <div style={s.emptyState}>
        <div style={s.emptyIcon}>🤝</div>
        <div style={s.emptyTitle}>還沒有社區接力</div>
        <div style={s.emptyHint}>在任務對話中選擇「發起接力」，邀請社區夥伴一起照顧樹木！</div>
      </div>
    );
  }

  return (
    <div style={s.list}>
      {actionMsg && <div style={s.toast}>{actionMsg}</div>}
      {chains.map((c) => (
        <div key={c.id} style={s.card}>
          <div style={s.cardTop} onClick={() => toggleExpand(c.id)}>
            <div style={s.chainIcon}>🤝</div>
            <div style={s.chainInfo}>
              <div style={s.chainTitle}>
                樹 {c.tree_id?.slice(-6)} 接力
              </div>
              <div style={s.chainMeta}>
                由 {c.users?.display_name || '???'} 發起 · {c.relay_count} 棒
                {c.status === 'completed' && ' ✅'}
              </div>
            </div>
            <div style={s.expandArrow}>{expanded === c.id ? '▲' : '▼'}</div>
          </div>

          {expanded === c.id && (
            <div style={s.legsWrap}>
              {legs.map((leg) => (
                <div key={leg.id} style={s.leg}>
                  <div style={s.legDot} />
                  <div style={s.legContent}>
                    <div style={s.legUser}>
                      第 {leg.leg_order} 棒 · {leg.users?.display_name || '???'}
                    </div>
                    {leg.photo_url && (
                      <img src={leg.photo_url} alt="" style={s.legPhoto} />
                    )}
                    {leg.comment && <div style={s.legComment}>{leg.comment}</div>}
                    <div style={s.legStatus}>
                      {leg.status === 'submitted' ? '✅ 完成' : '⏳ 進行中'}
                      {leg.submitted_at && ` · ${new Date(leg.submitted_at).toLocaleDateString('zh-TW')}`}
                    </div>
                  </div>
                </div>
              ))}
              {c.status === 'active' && (
                <button style={s.pickUpBtn} onClick={() => handlePickUp(c.id)}>
                  🏃 我來接棒！
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const s = {
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  empty: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, color: 'rgba(255,255,255,0.5)', padding: 32,
  },
  emptyState: { textAlign: 'center', padding: '32px 16px' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: '#e8f0e8', marginBottom: 8 },
  emptyHint: { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 },
  toast: {
    background: 'rgba(76,175,80,0.2)', border: '1px solid rgba(76,175,80,0.4)',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#a5d6a7',
    textAlign: 'center', marginBottom: 8,
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(120,180,120,0.15)',
    borderRadius: 12, overflow: 'hidden',
  },
  cardTop: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', cursor: 'pointer',
  },
  chainIcon: { fontSize: 24, flexShrink: 0 },
  chainInfo: { flex: 1, minWidth: 0 },
  chainTitle: { fontSize: 14, fontWeight: 600, color: '#e8f0e8' },
  chainMeta: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  expandArrow: { fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 },
  legsWrap: {
    padding: '4px 14px 14px 14px',
    borderTop: '1px solid rgba(120,180,120,0.1)',
  },
  leg: { display: 'flex', gap: 10, paddingTop: 10 },
  legDot: {
    width: 10, height: 10, borderRadius: '50%', background: '#4caf50',
    flexShrink: 0, marginTop: 4,
  },
  legContent: { flex: 1, minWidth: 0 },
  legUser: { fontSize: 13, fontWeight: 600, color: '#c8e6c9' },
  legPhoto: {
    width: '100%', borderRadius: 8, maxHeight: 120,
    objectFit: 'cover', marginTop: 6,
  },
  legComment: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  legStatus: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  pickUpBtn: {
    width: '100%', marginTop: 12, padding: '12px',
    background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.4)',
    borderRadius: 10, color: '#a5d6a7', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', textAlign: 'center',
  },
};
