'use client';

import { useState, useEffect, useRef } from 'react';

const CHAR_SPEED = 40;

export default function RPGDialogue({ tree, quest, loading, onAction, onClose }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showChoices, setShowChoices] = useState(false);
  const timerRef = useRef(null);

  const npcName = quest?.npc_name || `${tree?.species || '樹'}・${tree?.region || '台北'}`;
  const dialogue = loading
    ? '讓我找找今天的守護任務…'
    : getDefaultDialogue(tree, quest);

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

  const choices = loading
    ? []
    : quest?.satisfied
      ? [
          { label: '👀 查看守護紀錄', action: 'records' },
          { label: '❤️ 加入關注', action: 'follow' },
          { label: '🚶 下次再來', action: 'close' },
        ]
      : quest
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
            {quest.satisfied
              ? '✓ 任務已完成'
              : `${quest.quest_type === 'special' ? '★' : '◇'} ${quest.points} 點`}
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultDialogue(tree, quest) {
  if (quest?.satisfied) {
    return `謝謝守護者！這棵${tree?.species || '樹'}的拍照任務已經完成，紀錄也好好保存下來了。`;
  }
  if (quest?.quest_type === 'special') {
    return '特別委託！幫我拍張全樹照吧！';
  }
  if (quest) {
    return quest.npc_dialogue || '路過嗎？幫我拍張全樹照吧！';
  }
  return '你好！想看看我的資料嗎？';
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
    background: '#C44A2B',
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
    background: 'linear-gradient(135deg, rgba(42,36,30,0.92), rgba(32,28,22,0.95))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '2px solid rgba(232,93,58,0.5)',
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
    border: '2px solid rgba(232,93,58,0.4)',
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
    color: '#FFFCF7',
    fontSize: 15,
    lineHeight: 1.7,
    fontWeight: 400,
    minHeight: 52,
  },
  cursor: {
    color: '#F07B5E',
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
    border: '1px solid rgba(232,93,58,0.35)',
    borderRadius: 10,
    color: '#FFFCF7',
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
    background: '#5CB8B2',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    padding: '5px 12px',
    borderRadius: '0 0 10px 10px',
  },
};
