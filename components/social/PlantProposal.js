'use client';

import { useState } from 'react';
import { submitPlantingProposal } from '../../lib/quest-engine';

export default function PlantProposal({ playerCoords, currentDistrict, onClose, onSubmitted }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitPlantingProposal({
        lat: playerCoords?.lat || 0,
        lng: playerCoords?.lng || 0,
        reason: reason.trim(),
        photoUrl: null,
        areaId: currentDistrict,
      });
      setSuccess(true);
      onSubmitted?.();
    } catch (e) {
      setError(e.message || '提交失敗');
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div style={styles.overlay}>
        <div style={styles.panel}>
          <div style={styles.successIcon}>🌱</div>
          <div style={styles.successTitle}>提案已送出！</div>
          <div style={styles.successHint}>社區夥伴會看到你的建議</div>
          <button style={styles.doneBtn} onClick={onClose}>好的</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>🌱 建議種樹</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.location}>
          📍 目前位置 {playerCoords ? `${playerCoords.lat.toFixed(4)}, ${playerCoords.lng.toFixed(4)}` : '未知'}
        </div>

        <textarea
          style={styles.textarea}
          placeholder="為什麼這裡適合種樹？例如：人行道空曠缺蔭、有空間種植…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />

        {error && <div style={styles.error}>{error}</div>}

        <button
          style={{ ...styles.submitBtn, opacity: submitting || !reason.trim() ? 0.5 : 1 }}
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
        >
          {submitting ? '提交中…' : '送出建議'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 70,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    background: 'linear-gradient(135deg, rgba(50,40,20,0.95), rgba(35,28,15,0.98))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '2px solid rgba(212,160,23,0.4)',
    borderRadius: 20,
    padding: 20,
    color: '#f5f0e0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  location: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: 14,
    color: '#f5f0e0',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(212,160,23,0.3)',
    borderRadius: 12,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    marginBottom: 12,
    boxSizing: 'border-box',
    lineHeight: 1.6,
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: '#8d6e0a',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
  error: {
    fontSize: 13,
    color: '#ef5350',
    padding: '8px 0',
    textAlign: 'center',
  },
  successIcon: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 },
  successHint: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20 },
  doneBtn: {
    width: '100%',
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: '#8d6e0a',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
};
