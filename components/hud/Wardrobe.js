'use client';

import { useState } from 'react';
import { OUTFIT_PRESETS } from '../../lib/equipment';

const presetForOutfit = (outfit) => Object.entries(OUTFIT_PRESETS).find(([, preset]) =>
  Object.entries(preset.outfit).every(([slot, id]) => (outfit?.[slot] || null) === id)
)?.[0];

export default function Wardrobe({ currentOutfit, onApplyOutfit, onClose }) {
  const [selectedPreset, setSelectedPreset] = useState(() => presetForOutfit(currentOutfit));

  const applyPreset = (id, preset) => {
    setSelectedPreset(id);
    onApplyOutfit(preset.outfit);
  };

  return (
    <div style={s.overlay}>
      <div style={s.panel}>
        <div style={s.header}>
          <div>
            <div style={s.title}>選擇造型</div>
            <div style={s.subtitle}>每次會更換完整套裝</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.presets}>
          {Object.entries(OUTFIT_PRESETS).map(([id, preset]) => (
            <button
              key={id}
              style={{ ...s.presetBtn, ...(selectedPreset === id ? s.presetActive : {}) }}
              onClick={() => applyPreset(id, preset)}
            >
              <span style={s.presetName}>{preset.name}</span>
              <span style={s.presetDescription}>{preset.description}</span>
              {selectedPreset === id && <span style={s.equipped}>穿戴中</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 70,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)', padding: 16,
  },
  panel: {
    width: '100%', maxWidth: 420,
    background: 'linear-gradient(135deg, rgba(42,36,30,0.95), rgba(32,28,22,0.98))',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    border: '2px solid rgba(232,93,58,0.3)',
    borderRadius: 20, padding: 20, color: '#FFFCF7',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: 700 },
  subtitle: { marginTop: 3, fontSize: 12, color: 'rgba(255,255,255,.52)' },
  closeBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
    fontSize: 20, cursor: 'pointer', padding: '4px 8px',
  },
  presets: { display: 'flex', flexDirection: 'column', gap: 10 },
  presetBtn: {
    position: 'relative', display: 'flex', flexDirection: 'column', gap: 4,
    padding: '14px 16px', color: '#fff', textAlign: 'left',
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 12, cursor: 'pointer',
  },
  presetActive: {
    background: 'rgba(232,93,58,.17)', borderColor: 'rgba(232,93,58,.65)',
  },
  presetName: { fontSize: 15, fontWeight: 700 },
  presetDescription: { fontSize: 12, color: 'rgba(255,255,255,.55)', paddingRight: 64 },
  equipped: {
    position: 'absolute', right: 12, top: 12,
    fontSize: 11, color: '#F07B5E', fontWeight: 600,
    padding: '2px 8px', background: 'rgba(232,93,58,0.2)', borderRadius: 6,
  },
};
