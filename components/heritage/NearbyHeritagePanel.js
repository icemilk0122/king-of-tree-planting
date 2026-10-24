'use client';

import { useEffect, useMemo, useState } from 'react';
import { HERITAGE_INDEX_URL, getHeritagePresentation, normalizeHeritageIndex } from '../../lib/heritage';
import { OPENING_STORY_POSITION } from '../../lib/game-session';
import {
  HERITAGE_RADIUS_OPTIONS,
  filterNearbyHeritageTrees,
  formatDistance,
  getNearbyHeritageTrees,
} from '../../lib/heritage-nearby';
import styles from './NearbyHeritagePanel.module.css';

function HeritagePhoto({ tree, detail = false }) {
  const presentation = getHeritagePresentation(tree);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [presentation?.photo?.src]);

  if (!presentation?.photo || failed) {
    return (
      <div className={detail ? styles.photoEmpty : styles.thumbEmpty}>
        <span aria-hidden="true">樹</span>
        {detail && <small>{failed ? '照片載入失敗' : presentation?.emptyMessage}</small>}
      </div>
    );
  }

  return (
    <img
      className={detail ? styles.detailPhoto : styles.thumbnail}
      src={presentation.photo.src}
      alt={`${tree.species || '老樹'}，受保護樹木編號 ${presentation.heritageId}`}
      loading={detail ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  );
}

function TreeDetail({ tree, onNavigate }) {
  if (!tree) {
    return (
      <div className={styles.noSelection}>
        <span aria-hidden="true">⌁</span>
        <strong>這個範圍沒有符合的老樹</strong>
        <small>清除搜尋文字，或把步行範圍調大一點。</small>
      </div>
    );
  }

  const presentation = getHeritagePresentation(tree);
  return (
    <article className={styles.detailCard}>
      <div className={styles.detailMedia}>
        <HeritagePhoto tree={tree} detail />
        <div className={styles.distanceBadge}>
          <strong>{formatDistance(tree.distanceMeters)}</strong>
        </div>
      </div>
      <div className={styles.detailCopy}>
        <div className={styles.treeNumber}>受保護樹木 #{presentation.heritageId}</div>
        <div className={styles.titleRow}>
          <h3>{tree.species || '樹種待確認'}</h3>
          <span>{presentation.statusLabel}</span>
        </div>
        <p className={styles.address}>{tree.address || tree.region || '位置資料待補'}</p>
        <dl className={styles.facts}>
          <div><dt>直徑</dt><dd>{Number.isFinite(tree.diameter) ? `${tree.diameter} cm` : '—'}</dd></div>
          <div><dt>樹高</dt><dd>{Number.isFinite(tree.height) ? `${tree.height} m` : '—'}</dd></div>
        </dl>
        <div className={styles.actions}>
          <button type="button" className={styles.navigateButton} onClick={() => onNavigate?.(tree)}>
            <span aria-hidden="true">➜</span> 帶我去這棵樹
          </button>
          {presentation.sourcePage && (
            <a href={presentation.sourcePage} target="_blank" rel="noopener noreferrer">
              文化局資料 <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
        <small className={styles.credit}>{presentation.photoCredit}</small>
      </div>
    </article>
  );
}

export default function NearbyHeritagePanel({ origin, onClose, onNavigate }) {
  const [trees, setTrees] = useState([]);
  const [radius, setRadius] = useState(500);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    fetch(HERITAGE_INDEX_URL)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(payload => {
        if (!cancelled) setTrees(normalizeHeritageIndex(payload));
      })
      .catch(() => {
        if (!cancelled) setError('老樹資料暫時讀取不到，請稍後再試。');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const nearbyTrees = useMemo(
    () => getNearbyHeritageTrees(trees, origin || OPENING_STORY_POSITION, radius),
    [trees, origin, radius]
  );
  const visibleTrees = useMemo(
    () => filterNearbyHeritageTrees(nearbyTrees, query),
    [nearbyTrees, query]
  );

  useEffect(() => {
    if (!visibleTrees.length) {
      setSelectedId(null);
      return;
    }
    if (!visibleTrees.some(tree => tree.treeId === selectedId)) {
      setSelectedId(visibleTrees[0].treeId);
    }
  }, [selectedId, visibleTrees]);

  const selectedTree = visibleTrees.find(tree => tree.treeId === selectedId) || null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <section
        className={styles.panel}
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nearby-heritage-title"
      >
        <header className={styles.header}>
          <h2 id="nearby-heritage-title">附近的老樹</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="關閉附近老樹">×</button>
        </header>

        <div className={styles.body}>
          <section className={styles.summary}>
            <div className={styles.summaryCount}>
              <strong>{loading ? '—' : nearbyTrees.length}</strong>
              <span>棵老樹<br />在 {radius} 公尺內</span>
            </div>
            <div className={styles.radiusPicker} aria-label="步行範圍">
              {HERITAGE_RADIUS_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  className={radius === option ? styles.activeRadius : ''}
                  onClick={() => setRadius(option)}
                  aria-pressed={radius === option}
                >
                  {option < 1000 ? `${option}m` : `${option / 1000}km`}
                </button>
              ))}
            </div>
          </section>

          <label className={styles.searchField}>
            <span className={styles.searchLabel}>搜尋</span>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜尋附近的樹號、樹種或地址"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="清除搜尋">×</button>}
          </label>

          {error ? (
            <div className={styles.error} role="alert">{error}</div>
          ) : (
            <>
              <TreeDetail tree={selectedTree} onNavigate={onNavigate} />

              <div className={styles.listHeading} id="nearby-heritage-list-title">
                <span>由近到遠</span>
                <small>{visibleTrees.length} / {nearbyTrees.length}</small>
              </div>
              <div className={styles.treeList} aria-busy={loading} aria-labelledby="nearby-heritage-list-title">
                {loading && [0, 1, 2].map(item => <div className={styles.skeleton} key={item} />)}
                {!loading && visibleTrees.map((tree, index) => (
                  <button
                    type="button"
                    key={tree.treeId}
                    className={`${styles.treeRow} ${tree.treeId === selectedId ? styles.selectedRow : ''}`}
                    onClick={() => setSelectedId(tree.treeId)}
                    aria-pressed={tree.treeId === selectedId}
                  >
                    <span className={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.thumbFrame}><HeritagePhoto tree={tree} /></span>
                    <span className={styles.rowCopy}>
                      <small>#{tree.heritageId}</small>
                      <strong>{tree.species || '樹種待確認'}</strong>
                      <span>{tree.address || tree.region}</span>
                    </span>
                    <span className={styles.rowDistance}>{formatDistance(tree.distanceMeters)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <footer className={styles.footer}>臺北市政府文化局受保護樹木資料 · 依主角即時位置排序</footer>
      </section>
    </div>
  );
}
