'use client';

import { useState, useEffect, useRef } from 'react';

const TITLE_EN = 'SHADE KEEPERS';
const TITLE_ZH = '樹蔭守護者';

export default function TitleScreen({ onStart, onReset }) {
  const [phase, setPhase] = useState('intro');
  const [titleIdx, setTitleIdx] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      t += 0.003;
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#1a1410';
      ctx.fillRect(0, 0, w, h);

      const cols = 24, rows = 18;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const cx = (w / cols) * (i + 0.5);
          const cy = (h / rows) * (j + 0.5);
          const wave = Math.sin(t + i * 0.3 + j * 0.2) * 0.5 + 0.5;
          const alpha = 0.03 + wave * 0.06;
          const hue = 15 + Math.sin(t * 0.5 + i * 0.15) * 20;
          ctx.fillStyle = `hsla(${hue}, 60%, 35%, ${alpha})`;
          const r = 8 + wave * 12;
          ctx.beginPath();
          ctx.arc(cx, cy + Math.sin(t * 2 + i) * 3, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (let k = 0; k < 40; k++) {
        const px = ((k * 137.5 + t * 30) % w);
        const py = ((k * 97.3 + Math.sin(t + k) * 20) % h);
        const s = Math.sin(t * 3 + k) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(232, 147, 110, ${s * 0.15})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'intro') return;
    const full = TITLE_EN;
    if (titleIdx < full.length) {
      const timer = setTimeout(() => setTitleIdx(titleIdx + 1), 80);
      return () => clearTimeout(timer);
    }
    const menuTimer = setTimeout(() => {
      setPhase('menu');
      setShowMenu(true);
    }, 600);
    return () => clearTimeout(menuTimer);
  }, [phase, titleIdx]);

  function handleContinue() {
    setPhase('leaving');
    setTimeout(() => onStart?.('continue'), 800);
  }

  function handleReset() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setPhase('leaving');
    setTimeout(() => onReset?.(), 800);
  }

  return (
    <div style={{
      ...s.root,
      opacity: phase === 'leaving' ? 0 : 1,
      transition: 'opacity 0.8s ease',
    }}>
      <canvas ref={canvasRef} style={s.canvas} />

      <div style={s.center}>
        <div style={{
          ...s.zhTitle,
          opacity: titleIdx > 0 ? 1 : 0,
          transform: titleIdx > 0 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.6s, transform 0.6s',
        }}>
          {TITLE_ZH}
        </div>

        <div style={s.enTitle}>
          {TITLE_EN.slice(0, titleIdx)}
          {titleIdx < TITLE_EN.length && <span style={s.cursor}>_</span>}
        </div>

        <div style={{
          ...s.subtitle,
          opacity: showMenu ? 0.6 : 0,
          transition: 'opacity 0.8s ease 0.2s',
        }}>
          台北市行道樹守護 RPG
        </div>

        {showMenu && (
          <div style={{
            ...s.menu,
            animation: 'slideUp 0.5s ease-out',
          }}>
            <button style={s.btn} onClick={handleContinue}>
              <span style={s.btnIcon}>▶</span> 繼續遊戲
            </button>
            <button
              style={{ ...s.btn, ...s.btnSecondary }}
              onClick={handleReset}
            >
              <span style={s.btnIcon}>↺</span>
              {confirming ? '確定要重新開始？' : '重新開始'}
            </button>
          </div>
        )}
      </div>

      <div style={{
        ...s.footer,
        opacity: showMenu ? 0.3 : 0,
        transition: 'opacity 1s ease 0.6s',
      }}>
        v0.1 · 資料來源：台北市政府開放資料
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    position: 'fixed', inset: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column',
  },
  canvas: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
  },
  center: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, padding: '0 24px', textAlign: 'center',
  },
  zhTitle: {
    fontSize: 20, fontWeight: 400, color: 'rgba(240,123,94,0.85)',
    letterSpacing: '6px', marginBottom: 4,
  },
  enTitle: {
    fontSize: 'clamp(32px, 7vw, 56px)', fontWeight: 800,
    color: '#FFFCF7', letterSpacing: '4px',
    fontFamily: 'system-ui, sans-serif',
    textShadow: '0 0 40px rgba(232,93,58,0.4), 0 2px 12px rgba(0,0,0,0.5)',
  },
  cursor: {
    color: '#E85D3A', animation: 'blink 0.7s step-end infinite',
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,252,247,0.6)',
    letterSpacing: '2px', marginTop: 8,
  },
  menu: {
    display: 'flex', flexDirection: 'column', gap: 12,
    marginTop: 40, width: '100%', maxWidth: 280,
  },
  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '14px 24px',
    background: 'rgba(232,93,58,0.2)',
    border: '1px solid rgba(232,93,58,0.5)',
    borderRadius: 12, color: '#FFFCF7',
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    transition: 'background 0.2s, border-color 0.2s',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14, fontWeight: 500,
  },
  btnIcon: { fontSize: 14 },
  footer: {
    position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
    color: 'rgba(255,252,247,0.3)', fontSize: 11, letterSpacing: '1px',
    zIndex: 1,
  },
};
