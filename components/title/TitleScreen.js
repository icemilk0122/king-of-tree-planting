'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function TitleScreen({ onStart, onReset }) {
  const [phase, setPhase] = useState('loading');
  const [showMenu, setShowMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const canvasRef = useRef(null);
  const bgRef = useRef(null);
  const textRef = useRef(null);
  const charRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const breathRef = useRef(0);
  const loadedRef = useRef(0);

  useEffect(() => {
    const srcs = ['/images/title-bg.png', '/images/title-text.png', '/images/title-char.png'];
    srcs.forEach(src => {
      const img = new Image();
      img.onload = () => {
        loadedRef.current++;
        if (loadedRef.current >= srcs.length) {
          setPhase('ready');
          setTimeout(() => setShowMenu(true), 800);
        }
      };
      img.src = src;
    });
  }, []);

  const updateLayers = useCallback(() => {
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const dx = (mx - 0.5) * -8;
    const dy = (my - 0.5) * -5;
    breathRef.current += 0.02;
    const breath = Math.sin(breathRef.current) * 0.015;

    if (bgRef.current) {
      bgRef.current.style.transform = `scale(1.05) translate(${dx}px, ${dy}px)`;
    }
    if (textRef.current) {
      textRef.current.style.transform = `translate(${dx * 1.2}px, ${dy * 1.2}px)`;
    }
    if (charRef.current) {
      charRef.current.style.transform =
        `translate(${dx * 1.6}px, ${dy * 1.6}px) scale(${1.0 + breath})`;
    }
  }, []);

  useEffect(() => {
    let raf;
    function loop() {
      updateLayers();
      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(raf);
  }, [updateLayers]);

  useEffect(() => {
    function onMove(e) {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    }
    function onGyro(e) {
      if (e.gamma == null) return;
      mouseRef.current = {
        x: 0.5 + (e.gamma / 45) * 0.5,
        y: 0.5 + ((e.beta - 45) / 45) * 0.5,
      };
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('deviceorientation', onGyro);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('deviceorientation', onGyro);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const leaves = Array.from({ length: 18 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 3 + Math.random() * 5,
      speed: 0.15 + Math.random() * 0.3,
      drift: Math.random() * 2 - 1,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      hue: 80 + Math.random() * 60,
      alpha: 0.3 + Math.random() * 0.4,
    }));

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const leaf of leaves) {
        leaf.y += leaf.speed / h;
        leaf.x += leaf.drift * 0.0003 + Math.sin(leaf.y * 6) * 0.0005;
        leaf.rot += leaf.rotSpeed;
        if (leaf.y > 1.05) { leaf.y = -0.05; leaf.x = Math.random(); }
        if (leaf.x > 1.1) leaf.x = -0.1;
        if (leaf.x < -0.1) leaf.x = 1.1;

        ctx.save();
        ctx.translate(leaf.x * w, leaf.y * h);
        ctx.rotate(leaf.rot);
        ctx.fillStyle = `hsla(${leaf.hue}, 55%, 42%, ${leaf.alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  function handleContinue() {
    setPhase('leaving');
    setTimeout(() => onStart?.('continue'), 800);
  }

  function handleReset() {
    if (!confirming) { setConfirming(true); return; }
    setPhase('leaving');
    setTimeout(() => onReset?.(), 800);
  }

  const fadeIn = phase === 'loading' ? 0 : 1;

  return (
    <div style={{
      ...s.root,
      opacity: phase === 'leaving' ? 0 : 1,
      transition: 'opacity 0.8s ease',
    }}>
      {/* Layer 1: Background cityscape (parallax only) */}
      <div style={s.layerWrap}>
        <img ref={bgRef} src="/images/title-bg.png" alt="" style={{ ...s.layerImg, opacity: fadeIn, transition: 'opacity 1s ease' }} />
      </div>

      {/* Layer 2: Character (parallax + breathing) */}
      <div style={s.layerWrap}>
        <img ref={charRef} src="/images/title-char.png" alt="" style={{ ...s.layerImg, ...s.charImg, opacity: fadeIn, transition: 'opacity 1s ease 0.2s' }} />
      </div>

      {/* Layer 3: Title text (parallax, slight) */}
      <div style={s.layerWrap}>
        <img ref={textRef} src="/images/title-text.png" alt="樹蔭守護者" style={{ ...s.layerImg, opacity: fadeIn, transition: 'opacity 1s ease 0.4s' }} />
      </div>

      <div style={s.vignette} />

      <canvas ref={canvasRef} style={s.leafCanvas} />

      <div style={s.bottomWrap}>
        {showMenu && (
          <div style={{ ...s.menu, animation: 'titleSlideUp 0.6s ease-out' }}>
            <button style={s.btn} onClick={handleContinue}>
              <span style={s.btnIcon}>▶</span> 繼續遊戲
            </button>
            <button style={{ ...s.btn, ...s.btnSecondary }} onClick={handleReset}>
              <span style={s.btnIcon}>↺</span>
              {confirming ? '確定要重新開始？' : '重新開始'}
            </button>
          </div>
        )}
        <div style={{ ...s.footer, opacity: showMenu ? 0.4 : 0, transition: 'opacity 1s ease 0.3s' }}>
          v0.1 · 資料來源：台北市政府開放資料
        </div>
      </div>

      <style>{`
        @keyframes titleSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: '#1a1410',
    overflow: 'hidden',
  },
  layerWrap: {
    position: 'absolute', inset: '-30px',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  layerImg: {
    width: '100%', height: '100%',
    objectFit: 'cover', objectPosition: 'center center',
    willChange: 'transform',
  },
  charImg: {
    transformOrigin: '60% 50%',
  },
  vignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(20,16,10,0.55) 100%)',
    pointerEvents: 'none', zIndex: 4,
  },
  leafCanvas: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 5,
  },
  bottomWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
    zIndex: 10,
    background: 'linear-gradient(transparent 0%, rgba(20,16,10,0.85) 100%)',
    paddingTop: 80,
  },
  menu: {
    display: 'flex', flexDirection: 'column', gap: 12,
    width: '100%', maxWidth: 280, padding: '0 24px',
  },
  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '14px 24px',
    background: 'rgba(232,93,58,0.25)',
    border: '1.5px solid rgba(232,93,58,0.55)',
    borderRadius: 14, color: '#FFFCF7',
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    transition: 'background 0.2s, border-color 0.2s',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14, fontWeight: 500,
    boxShadow: 'none',
  },
  btnIcon: { fontSize: 14 },
  footer: {
    color: 'rgba(255,252,247,0.4)', fontSize: 11, letterSpacing: '1px',
    marginTop: 16,
  },
};
