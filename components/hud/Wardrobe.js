'use client';

import { useState } from 'react';
import { EQUIPMENT, EQUIP_SLOTS } from '../../lib/equipment';

const SLOT_LABELS = {
  hair: '髮型', hat: '帽子', top: '上衣',
  bottom: '褲子', shoes: '鞋子', acc: '配件',
};

export default function Wardrobe({ currentOutfit, onChangeEquip, onRemoveEquip, onClose }) {
  const [activeSlot, setActiveSlot] = useState('hat');

  const itemsForSlot = Object.entries(EQUIPMENT)
    .filter(([, def]) => def.slot === activeSlot);

  const currentItem = currentOutfit?.[activeSlot];

  return (
    <div style={s.overlay}>
      <div style={s.panel}>
        <div style={s.header}>
          <span style={s.title}>換裝</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.slots}>
          {EQUIP_SLOTS.map(slot => (
            <button
              key={slot}
              style={{ ...s.slotBtn, ...(activeSlot === slot ? s.slotActive : {}) }}
              onClick={() => setActiveSlot(slot)}
            >
              {SLOT_LABELS[slot]}
            </button>
          ))}
        </div>

        <div style={s.items}>
          {itemsForSlot.map(([id, def]) => (
            <button
              key={id}
              style={{ ...s.itemBtn, ...(currentItem === id ? s.itemActive : {}) }}
              onClick={() => onChangeEquip(id)}
            >
              <span style={s.itemName}>{def.name}</span>
              {currentItem === id && <span style={s.equipped}>穿戴中</span>}
            </button>
          ))}
          {currentItem && (
            <button
              style={s.removeBtn}
              onClick={() => onRemoveEquip(activeSlot)}
            >
              脫下{SLOT_LABELS[activeSlot]}
            </button>
          )}
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
  closeBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
    fontSize: 20, cursor: 'pointer', padding: '4px 8px',
  },
  slots: {
    display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap',
  },
  slotBtn: {
    padding: '8px 14px', fontSize: 13, fontWeight: 600,
    color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer',
  },
  slotActive: {
    color: '#fff', background: 'rgba(232,93,58,0.25)',
    borderColor: 'rgba(232,93,58,0.6)',
  },
  items: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  itemBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 14px', fontSize: 14, color: '#FFFCF7',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    cursor: 'pointer', textAlign: 'left',
  },
  itemActive: {
    background: 'rgba(232,93,58,0.15)',
    borderColor: 'rgba(232,93,58,0.5)',
  },
  itemName: { fontWeight: 600 },
  equipped: {
    fontSize: 11, color: '#F07B5E', fontWeight: 600,
    padding: '2px 8px', background: 'rgba(232,93,58,0.2)', borderRadius: 6,
  },
  removeBtn: {
    padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.5)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10,
    cursor: 'pointer', textAlign: 'center', marginTop: 4,
  },
};
