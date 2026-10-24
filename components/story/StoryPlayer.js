'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const CHAR_SPEED = 35;

const PORTRAITS = {
  elder: { emoji: '🌳', color: '#C44A2B' },
};

export default function StoryPlayer({ story, onComplete }) {
  const [pageIdx, setPageIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const timerRef = useRef(null);
  const prevStoryRef = useRef(story);

  if (prevStoryRef.current !== story) {
    prevStoryRef.current = story;
    setPageIdx(0);
    setDisplayedText('');
    setIsTyping(true);
    setShowPrompt(false);
  }

  const safeIdx = Math.min(pageIdx, story.pages.length - 1);
  const page = story.pages[safeIdx];
  const isLast = safeIdx >= story.pages.length - 1;

  if (!page) return null;

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    setShowPrompt(false);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setDisplayedText(page.text.slice(0, i));
      if (i >= page.text.length) {
        clearInterval(timerRef.current);
        setIsTyping(false);
        setTimeout(() => setShowPrompt(true), 300);
      }
    }, CHAR_SPEED);
    return () => clearInterval(timerRef.current);
  }, [safeIdx, page.text]);

  const lastTapRef = useRef(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 200) return;
    lastTapRef.current = now;

    if (isTyping) {
      clearInterval(timerRef.current);
      setDisplayedText(page.text);
      setIsTyping(false);
      setTimeout(() => setShowPrompt(true), 100);
      return;
    }
    if (isLast) {
      onComplete?.();
    } else {
      setPageIdx(prev => prev + 1);
    }
  }, [isTyping, isLast, page.text, onComplete]);

  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleTap]);

  const portrait = page.portrait ? PORTRAITS[page.portrait] : null;

  return (
    <div style={{ ...s.overlay, background: `rgba(0,0,0,${page.overlay || 0.5})` }} onClick={handleTap}>
      {portrait && (
        <div style={s.portraitWrap}>
          <div style={{ ...s.portrait, borderColor: portrait.color }}>
            <span style={s.portraitEmoji}>{portrait.emoji}</span>
          </div>
        </div>
      )}

      <div style={s.dialogueWrap} onClick={(e) => e.stopPropagation()}>
        <div style={s.nameTag}>{page.speaker}</div>
        <div style={s.dialogueBox} onClick={handleTap}>
          <div style={s.text}>
            {displayedText}
            {isTyping && <span style={s.cursor}>|</span>}
          </div>
          {showPrompt && (
            <div style={s.prompt}>
              {isLast ? '點擊開始冒險' : '點擊繼續'}
              <span style={s.promptArrow}>▼</span>
            </div>
          )}
        </div>
        <div style={s.pageCount}>
          {pageIdx + 1} / {story.pages.length}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 80,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'flex-end', alignItems: 'center',
    transition: 'background 0.5s',
    cursor: 'pointer',
  },
  portraitWrap: {
    position: 'absolute',
    left: '10%', bottom: 200,
    animation: 'portraitIn 0.4s ease-out',
  },
  portrait: {
    width: 100, height: 100, borderRadius: 20,
    background: 'rgba(42,36,30,0.8)',
    border: '3px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  },
  portraitEmoji: { fontSize: 48, lineHeight: 1 },
  dialogueWrap: {
    width: '100%', maxWidth: 700, padding: '0 16px',
    marginBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
  },
  nameTag: {
    display: 'inline-block',
    background: 'rgba(232,93,58,0.9)',
    color: '#FFFCF7', fontSize: 14, fontWeight: 700,
    padding: '6px 18px',
    borderRadius: '12px 12px 0 0',
    marginLeft: 12,
  },
  dialogueBox: {
    background: 'linear-gradient(135deg, rgba(42,36,30,0.95), rgba(32,28,22,0.98))',
    border: '2px solid rgba(232,93,58,0.3)',
    borderRadius: '0 16px 16px 16px',
    padding: '20px 24px',
    minHeight: 100,
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    cursor: 'pointer',
  },
  text: {
    color: '#FFFCF7', fontSize: 16, lineHeight: 1.8,
    fontWeight: 400,
  },
  cursor: {
    color: '#F07B5E',
    animation: 'blink 0.7s step-end infinite',
  },
  prompt: {
    color: 'rgba(255,252,247,0.6)', fontSize: 13,
    textAlign: 'right', marginTop: 12,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  promptArrow: {
    display: 'inline-block', marginLeft: 6,
    animation: 'bounce 1s ease-in-out infinite',
  },
  pageCount: {
    color: 'rgba(255,255,255,0.25)', fontSize: 11,
    textAlign: 'right', marginTop: 6, marginRight: 4,
  },
};
