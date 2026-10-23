'use client';

import { useState, useEffect, useRef } from 'react';

const CHAR_SPEED = 40;

export default function RPGDialogue({ tree, quest, loading, onAction, onClose }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showChoices, setShowChoices] = useState(false);
  const timerRef = useRef(null);

  const npcName = quest?.npc_name || `${tree?.species || '樹'}・${tree?.region || '台北'}`;
  const dialogue = quest?.npc_dialogue || getDefaultDialogue(tree, quest);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    setShowChoices(false);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setDisplayedText(dialogue.slice(0, i));
      if (i >= dialogue.length) {
        clearInterval(timerRef.current);
        setIsTyping(false);
        setTimeout(() => setShowChoices(true), 200);
      }
    }, CHAR_SPEED);
    return () => clearInterval(timerRef.current);
  }, [dialogue]);

  function skipTyping() {
    if (!isTyping) return;
    clearInterval(timerRef.current);
    setDisplayedText(dialogue);
    setIsTyping(false);
    setTimeout(() => setShowChoices(true), 100);
  }

  const choices = quest
    ? [
        { label: '📸 好啊，我來拍！', action: 'photo' },
        { label: '🤝 發起社區接力', action: 'relay' },
        { label: '👀 先看看你的紀錄', action: 'records' },
        { label: '🚶 下次再來', action: 'close' },
      ]
    : [
        { label: '👀 看看你的資料', action: 'info' },
        { label: '❤️ 加入關注', action: 'follow' },
        { label: '🚶 下次再來', action: 'close' },
      ];

  return (
    <div style={styles.overlay} onClick={skipTyping}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        <div style={styles.nameTag}>
          {quest?.quest_type === 'special' ? '★' : '◇'} {npcName}
        </div>
        <div style={styles.dialogueBox}>
          <div style={styles.portrait}>
            <div style={styles.portraitInner}>🌳</div>
          </div>
          <div style={styles.textArea}>
            <div style={styles.text} onClick={skipTyping}>
              {displayedText}
              {isTyping && <span style={styles.cursor}>▍</span>}
            </div>
            {showChoices && (
              <div style={styles.choices}>
                {choices.map((c) => (
                  <button
                    key={c.action}
                    style={styles.choiceBtn}
                    onClick={() => {
                      if (c.action === 'close') onClose?.();
                      else onAction?.(c.action);
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {quest && (
          <div style={styles.pointsBadge}>
            {quest.quest_type === 'special' ? '★' : '◇'} {quest.points} 點
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultDialogue(tree, quest) {
  if (quest?.quest_type === 'special') {
    return `這是特別委託！我是這一帶的老朋友了，最近需要特別關注。能幫我拍張近照嗎？核對可用後共 ${quest.points} 點。`;
  }
  if (quest) {
    return `好久沒人來看我了…路過的話，幫我拍張全樹照吧。核對可用後 +${quest.points} 點。`;
  }
  return `你好啊，我是這裡的${tree?.species || '樹'}。很高興有人注意到我，要不要認識一下？`;
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 60,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.15)',
    padding: '0 0 calc(16px + env(safe-area-inset-bottom, 0px)) 0',
  },
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
    margin: '0 8px',
  },
  nameTag: {
    display: 'inline-block',
    background: '#2e7d32',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    padding: '6px 16px',
    borderRadius: '12px 12px 0 0',
    marginLeft: 12,
    letterSpacing: '0.5px',
  },
  dialogueBox: {
    display: 'flex',
    gap: 12,
    background: 'linear-gradient(135deg, rgba(30,50,30,0.92), rgba(20,35,20,0.95))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '2px solid rgba(80,140,80,0.5)',
    borderRadius: '0 16px 16px 16px',
    padding: 16,
    minHeight: 140,
  },
  portrait: {
    flexShrink: 0,
    width: 72,
    height: 72,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.1)',
    border: '2px solid rgba(120,180,120,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  portraitInner: {
    fontSize: 36,
    lineHeight: 1,
  },
  textArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
  },
  text: {
    color: '#e8f0e8',
    fontSize: 15,
    lineHeight: 1.7,
    fontWeight: 400,
    minHeight: 52,
  },
  cursor: {
    color: '#8fc98f',
    animation: 'blink 0.8s step-end infinite',
    marginLeft: 1,
  },
  choices: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  choiceBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(120,180,120,0.35)',
    borderRadius: 10,
    color: '#c8e6c9',
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 14px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },
  pointsBadge: {
    position: 'absolute',
    top: 0,
    right: 16,
    background: '#d4a017',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    padding: '5px 12px',
    borderRadius: '0 0 10px 10px',
  },
};
