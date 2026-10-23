'use client';

import { useRef, useEffect, useCallback } from 'react';

const SIZE = 120;
const KNOB = 44;
const MAX_R = (SIZE - KNOB) / 2;

export default function VirtualJoystick({ onInput, side = 'left' }) {
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const activeTouch = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const handleMove = useCallback((cx, cy) => {
    const dx = cx - centerRef.current.x;
    const dy = cy - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, MAX_R);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * clamped;
    const ny = Math.sin(angle) * clamped;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }

    const normX = nx / MAX_R;
    const normY = ny / MAX_R;
    onInput?.(normX, normY);
  }, [onInput]);

  const handleEnd = useCallback(() => {
    activeTouch.current = null;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0, 0)';
    }
    onInput?.(0, 0);
  }, [onInput]);

  useEffect(() => {
    const el = baseRef.current;
    if (!el) return;

    function onTouchStart(e) {
      if (activeTouch.current !== null) return;
      const touch = e.changedTouches[0];
      activeTouch.current = touch.identifier;
      const rect = el.getBoundingClientRect();
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      handleMove(touch.clientX, touch.clientY);
      e.preventDefault();
    }

    function onTouchMove(e) {
      for (const touch of e.changedTouches) {
        if (touch.identifier === activeTouch.current) {
          handleMove(touch.clientX, touch.clientY);
          e.preventDefault();
          return;
        }
      }
    }

    function onTouchEnd(e) {
      for (const touch of e.changedTouches) {
        if (touch.identifier === activeTouch.current) {
          handleEnd();
          return;
        }
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleMove, handleEnd]);

  const posStyle = side === 'left'
    ? { left: 24, bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }
    : { right: 24, bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' };

  return (
    <div ref={baseRef} style={{ ...s.base, ...posStyle }}>
      <div ref={knobRef} style={s.knob} />
    </div>
  );
}

const s = {
  base: {
    position: 'fixed', zIndex: 45,
    width: SIZE, height: SIZE, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    touchAction: 'none', userSelect: 'none',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
  },
  knob: {
    width: KNOB, height: KNOB, borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    border: '2px solid rgba(255,255,255,0.35)',
    transition: 'transform 0.05s ease-out',
    pointerEvents: 'none',
  },
};
