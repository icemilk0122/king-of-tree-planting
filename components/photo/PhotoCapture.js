'use client';

import { useState, useRef, useCallback } from 'react';
import { submitPhoto } from '../../lib/quest-engine';
import { supabase } from '../../lib/supabase';
import { getDeviceId } from '../../lib/device-id';

export default function PhotoCapture({ tree, quest, onClose, onSubmitted }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  }, []);

  async function handleSubmit() {
    if (!file || !quest) return;
    setSubmitting(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `photos/${getDeviceId()}/${quest.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('quest-photos')
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('quest-photos')
        .getPublicUrl(path);

      const res = await submitPhoto({
        questId: quest.id,
        photoUrl: publicUrl,
        comment: comment.trim() || null,
        isDemo: false,
      });
      setResult(res);
      onSubmitted?.(res);
    } catch (e) {
      console.error('Photo submit error:', e);
      setError(e.message || '上傳失敗，請再試一次');
    }
    setSubmitting(false);
  }

  if (result) {
    return (
      <div style={styles.overlay}>
        <div style={styles.panel}>
          <div style={styles.successIcon}>🎉</div>
          <div style={styles.successTitle}>提交成功！</div>
          <div style={styles.successPoints}>+{result.points} 護樹點</div>
          <div style={styles.successTotal}>累計 {result.totalPoints} 點</div>
          <button style={styles.doneBtn} onClick={onClose}>好的！</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>📸 拍照回報</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {tree && (
          <div style={styles.treeInfo}>
            {quest?.quest_type === 'special' ? '★' : '◇'}{' '}
            {quest?.npc_name || `${tree.species || '樹'}・${tree.region || ''}`}
            {quest && <span style={styles.questPoints}>{quest.points} 點</span>}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        {preview ? (
          <div style={styles.previewWrap}>
            <img src={preview} alt="preview" style={styles.previewImg} />
            <button style={styles.retakeBtn} onClick={() => { setPreview(null); setFile(null); inputRef.current?.click(); }}>
              重拍
            </button>
          </div>
        ) : (
          <button style={styles.captureBtn} onClick={() => inputRef.current?.click()}>
            📷 拍照或選擇照片
          </button>
        )}

        {preview && (
          <textarea
            style={styles.commentInput}
            placeholder="留言（可選）…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
        )}

        {error && <div style={styles.error}>{error}</div>}

        {preview && quest && (
          <button
            style={{ ...styles.submitBtn, opacity: submitting ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '上傳中…' : '✅ 提交回報'}
          </button>
        )}

        {preview && !quest && (
          <div style={styles.noQuestHint}>
            這棵樹目前沒有任務，但照片仍會保存。
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
    zIndex: 70,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    padding: '16px',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    background: 'linear-gradient(135deg, rgba(30,50,30,0.95), rgba(20,35,20,0.98))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '2px solid rgba(80,140,80,0.4)',
    borderRadius: 20,
    padding: 20,
    color: '#e8f0e8',
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
  treeInfo: {
    fontSize: 14,
    fontWeight: 600,
    color: '#a5d6a7',
    marginBottom: 16,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
  },
  questPoints: {
    float: 'right',
    color: '#d4a017',
    fontWeight: 700,
  },
  captureBtn: {
    width: '100%',
    padding: '40px 20px',
    fontSize: 16,
    fontWeight: 600,
    color: '#e8f0e8',
    background: 'rgba(255,255,255,0.08)',
    border: '2px dashed rgba(120,180,120,0.4)',
    borderRadius: 16,
    cursor: 'pointer',
    textAlign: 'center',
  },
  previewWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  previewImg: {
    width: '100%',
    borderRadius: 12,
    maxHeight: 300,
    objectFit: 'cover',
  },
  retakeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  commentInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    color: '#e8f0e8',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(120,180,120,0.3)',
    borderRadius: 10,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    marginBottom: 12,
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: '#2e7d32',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
  noQuestHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    padding: '8px 0',
  },
  error: {
    fontSize: 13,
    color: '#ef5350',
    padding: '8px 0',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
  },
  successPoints: {
    fontSize: 28,
    fontWeight: 700,
    color: '#d4a017',
    textAlign: 'center',
    marginBottom: 4,
  },
  successTotal: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  doneBtn: {
    width: '100%',
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: '#2e7d32',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
};
