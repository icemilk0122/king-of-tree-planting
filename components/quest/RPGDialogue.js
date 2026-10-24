'use client';

import { useState, useEffect, useRef } from 'react';
import { getHeritagePresentation } from '../../lib/heritage';
import { getTreeInteractionName } from '../../lib/tree-quest';

const CHAR_SPEED = 40;

export default function RPGDialogue({ tree, quest, loading, onAction, onClose }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showChoices, setShowChoices] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const timerRef = useRef(null);

  const interactionName = getTreeInteractionName(tree);
  const dialogue = loading
    ? '讓我找找今天的守護任務…'
    : getDefaultDialogue(tree, quest);
  const heritage = getHeritagePresentation(tree);
  const showHeritagePhoto = heritage?.photo && !photoFailed;

  useEffect(() => {
    setPhotoFailed(false);
  }, [tree?.treeId]);

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

  const baseChoices = loading
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
  const choices = heritage
    ? [
        ...baseChoices.filter(choice => choice.action !== 'close'),
        { label: '📖 查看附近老樹圖鑑', action: 'heritage' },
        ...baseChoices.filter(choice => choice.action === 'close'),
      ]
    : baseChoices;

  return (
    <div style={styles.overlay} onClick={skipTyping}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        {heritage && (
          <figure style={styles.heritageMedia}>
            {showHeritagePhoto ? (
              <img
                src={heritage.photo.src}
                alt={`${tree.species || '老樹'}，受保護樹木編號 ${heritage.heritageId}`}
                style={styles.heritagePhoto}
                loading="lazy"
                decoding="async"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div style={styles.heritageEmpty} role="status">
                <span style={styles.heritageEmptyIcon}>樹</span>
                <span>{photoFailed ? '照片載入失敗，請稍後再試' : heritage.emptyMessage}</span>
              </div>
            )}
            <figcaption style={styles.heritageCaption}>
              <span>受保護樹木 #{heritage.heritageId}</span>
              <span style={styles.heritageStatus}>{heritage.statusLabel}</span>
            </figcaption>
          </figure>
        )}
        <div style={styles.nameTag}>
          {quest?.quest_type === 'special' ? '★' : '◇'} {interactionName}
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
        {heritage && (
          <div style={styles.heritageSource}>
            <span style={styles.heritageCredit}>{heritage.photoCredit}</span>
            {heritage.sourcePage && (
              <a
                className="heritage-source-link"
                href={heritage.sourcePage}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.heritageLink}
                aria-label={`查看受保護樹木 ${heritage.heritageId} 的文化局資料（另開新視窗）`}
              >
                查看文化局老樹資料 <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
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
    maxHeight: 'calc(100dvh - 28px - env(safe-area-inset-top, 0px))',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    scrollbarWidth: 'thin',
  },
  heritageMedia: {
    position: 'relative',
    margin: '0 0 8px',
    background: '#171E17',
    border: '2px solid #C89A45',
    borderRadius: 18,
    overflow: 'hidden',
  },
  heritagePhoto: {
    display: 'block',
    width: '100%',
    height: 'clamp(180px, 32vh, 300px)',
    objectFit: 'contain',
    background: '#171E17',
  },
  heritageEmpty: {
    minHeight: 'clamp(150px, 26vh, 240px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    color: '#F5E7C7',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  heritageEmptyIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 48,
    height: 48,
    border: '1px solid #C89A45',
    borderRadius: '50%',
    color: '#E8BD68',
    fontFamily: 'serif',
    fontSize: 22,
  },
  heritageCaption: {
    position: 'absolute',
    inset: 'auto 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '22px 14px 10px',
    color: '#FFF4D8',
    background: 'linear-gradient(transparent, rgba(20,27,20,0.92))',
    fontSize: 12,
    fontWeight: 750,
    letterSpacing: '0.04em',
  },
  heritageStatus: {
    color: '#E8BD68',
    textAlign: 'right',
  },
  heritageSource: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
    padding: '9px 12px 9px 16px',
    background: '#202820',
    border: '1px solid #5F6E53',
    borderRadius: 12,
  },
  heritageCredit: {
    color: '#CAD2BF',
    fontSize: 11,
    lineHeight: 1.35,
  },
  heritageLink: {
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    color: '#FFE09B',
    fontSize: 12,
    fontWeight: 800,
    textDecoration: 'none',
    padding: '0 4px',
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
