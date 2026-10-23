'use client';

import { useState, useEffect, useRef } from 'react';

export default function QuestNav({ quest, getTargetPos, getPlayerPos, onArrive, onCancel }) {
  const [distance, setDistance] = useState(null);
  const [angle, setAngle] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    function tick() {
      const target = getTargetPos?.();
      const player = getPlayerPos?.();
      if (!target || !player) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dx = target.x - player.x;
      const dz = target.z - player.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      setDistance(dist);
      setAngle(Math.atan2(dx, -dz));

      if (dist < 5) {
        onArrive?.();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [getTargetPos, getPlayerPos, onArrive]);

  const distLabel = distance !== null
    ? distance < 10 ? '就在附近！' : `${Math.round(distance)} 步`
    : '計算中…';

  return (
    <div style={s.container}>
      <div style={s.arrow} >
        <div style={{
          ...s.arrowInner,
          transform: `rotate(${angle}rad)`,
        }}>
          ▲
        </div>
      </div>
      <div style={s.info}>
        <div style={s.name}>{quest?.npc_name || '目標樹'}</div>
        <div style={s.dist}>{distLabel}</div>
      </div>
      <button style={s.cancelBtn} onClick={onCancel}>✕</button>
    </div>
  );
}

const s = {
  container: {
    position: 'fixed',
    top: 'calc(60px + env(safe-area-inset-top, 0px))',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 55,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(30,50,30,0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(212,160,23,0.5)',
    borderRadius: 16,
    padding: '10px 16px',
    color: '#e8f0e8',
  },
  arrow: {
    width: 40, height: 40,
    borderRadius: '50%',
    background: 'rgba(212,160,23,0.2)',
    border: '2px solid rgba(212,160,23,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  arrowInner: {
    fontSize: 20, color: '#d4a017',
    transition: 'transform 0.1s ease-out',
    lineHeight: 1,
  },
  info: { minWidth: 0 },
  name: { fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  dist: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  cancelBtn: {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.4)', fontSize: 18,
    cursor: 'pointer', padding: '4px 8px', flexShrink: 0,
  },
};
