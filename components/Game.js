'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initGame } from '../lib/engine';
import RPGDialogue from './quest/RPGDialogue';
import ActionBar from './hud/ActionBar';
import { getQuestsForTree, acceptQuest, toggleFollowTree } from '../lib/quest-engine';
import PhotoCapture from './photo/PhotoCapture';
import NearbyQuests from './quest/NearbyQuests';
import MyRecords from './records/MyRecords';
import DistrictMap from './map/DistrictMap';

export default function Game() {
  const containerRef = useRef(null);
  const coordRef = useRef(null);
  const treeInfoRef = useRef(null);
  const gameRef = useRef(null);

  const [selectedTree, setSelectedTree] = useState(null);
  const [treeQuest, setTreeQuest] = useState(null);
  const [weather, setWeather] = useState(null);
  const [address, setAddress] = useState('');
  const [cameraMode, setCameraMode] = useState('');
  const [showDialogue, setShowDialogue] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [questLoading, setQuestLoading] = useState(false);

  const onTreeClick = useCallback(async (data) => {
    if (!data) {
      setSelectedTree(null);
      setShowDialogue(false);
      return;
    }
    setSelectedTree(data);
    setTreeQuest(null);
    setShowDialogue(true);
    setQuestLoading(true);
    try {
      const quests = await getQuestsForTree(data.treeId);
      if (quests.length > 0) {
        setTreeQuest(quests[0]);
      }
    } catch (e) {
      console.warn('Quest fetch failed:', e);
    }
    setQuestLoading(false);
  }, []);

  const onWeatherUpdate = useCallback((data) => {
    setWeather(data);
  }, []);

  const onAddressUpdate = useCallback((addr) => {
    setAddress(addr);
  }, []);

  const onCameraModeChange = useCallback((label) => {
    setCameraMode(label);
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = initGame(
      containerRef.current, coordRef.current, treeInfoRef.current,
      onTreeClick, onWeatherUpdate, onAddressUpdate, onCameraModeChange
    );
    return () => {
      if (gameRef.current?.cleanup) {
        gameRef.current.cleanup();
        gameRef.current = null;
      }
    };
  }, [onTreeClick, onWeatherUpdate, onAddressUpdate, onCameraModeChange]);

  async function handleDialogueAction(action) {
    if (action === 'photo') {
      if (treeQuest) {
        try {
          await acceptQuest(treeQuest.id);
        } catch (e) {
          console.warn('Accept quest failed:', e);
        }
      }
      setShowDialogue(false);
      setActivePanel('photo');
    } else if (action === 'records') {
      setShowDialogue(false);
      setActivePanel('records');
    } else if (action === 'info') {
      setShowDialogue(false);
    } else if (action === 'follow') {
      if (selectedTree?.treeId) {
        try {
          await toggleFollowTree(selectedTree.treeId);
        } catch (e) {
          console.warn('Follow failed:', e);
        }
      }
      setShowDialogue(false);
    }
  }

  function closeDialogue() {
    setShowDialogue(false);
    setSelectedTree(null);
  }

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />

      {/* Top-left HUD */}
      <div style={styles.hud}>
        <div style={styles.title}>樹蔭守護者</div>
        <div ref={coordRef} style={styles.coord}>25.0330, 121.5654</div>
        {address && <div style={styles.address}>📍 {address}</div>}
      </div>

      {/* Weather */}
      {weather && (
        <div style={styles.weatherHud}>
          <div style={styles.weatherIcon}>{weather.icon}</div>
          <div>
            <div style={styles.weatherTemp}>{weather.temp}°C</div>
            <div style={styles.weatherLabel}>{weather.label}</div>
          </div>
        </div>
      )}

      {/* Records button */}
      <button
        style={styles.recordsBtn}
        onClick={() => setActivePanel(activePanel === 'records' ? null : 'records')}
      >
        🏆 我的紀錄
      </button>

      {/* Proximity tree info */}
      <div ref={treeInfoRef} style={styles.treeInfo} />

      {/* Camera mode */}
      {cameraMode && (
        <div style={styles.cameraModeHud}>🎥 {cameraMode}</div>
      )}

      {/* Controls hint */}
      <div style={styles.controls}>
        WASD: 移動 &nbsp; Q/E: 旋轉 &nbsp; 滾輪: 縮放 &nbsp; V: 視角
      </div>

      {/* RPG Dialogue */}
      {showDialogue && selectedTree && (
        <RPGDialogue
          tree={selectedTree}
          quest={treeQuest}
          loading={questLoading}
          onAction={handleDialogueAction}
          onClose={closeDialogue}
        />
      )}

      {/* Nearby Quests Panel */}
      {activePanel === 'nearby' && (
        <NearbyQuests
          areaId="daan"
          onSelectQuest={(q) => {
            setTreeQuest(q);
            setSelectedTree({ treeId: q.tree_id, species: '', region: '' });
            setActivePanel(null);
            setShowDialogue(true);
          }}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Photo Capture Panel */}
      {activePanel === 'photo' && (
        <PhotoCapture
          tree={selectedTree}
          quest={treeQuest}
          onClose={() => { setActivePanel(null); setSelectedTree(null); setTreeQuest(null); }}
          onSubmitted={() => {}}
        />
      )}

      {/* District Map */}
      {activePanel === 'map' && (
        <DistrictMap
          onTeleport={(lat, lng) => {
            gameRef.current?.teleport(lat, lng);
          }}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* My Records Panel */}
      {activePanel === 'records' && (
        <MyRecords onClose={() => setActivePanel(null)} />
      )}

      {/* Bottom Action Bar (hidden when dialogue or photo is open) */}
      {!showDialogue && activePanel !== 'photo' && (
        <ActionBar
          onNearbyQuests={() => setActivePanel('nearby')}
          onPhotoReport={() => setActivePanel('photo')}
          onPlantTree={() => setActivePanel('plant')}
          onMap={() => setActivePanel('map')}
          onRecords={() => setActivePanel('records')}
        />
      )}
    </>
  );
}

const styles = {
  hud: {
    position: 'fixed',
    top: 'calc(16px + env(safe-area-inset-top, 0px))',
    left: 16,
    color: '#fff',
    fontSize: 14,
    background: 'rgba(0,0,0,0.6)',
    padding: '12px 16px',
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
    lineHeight: 1.6,
    fontFamily: 'var(--font-family)',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },
  coord: {
    fontVariantNumeric: 'tabular-nums',
    opacity: 0.8,
  },
  address: {
    fontSize: 13,
    opacity: 0.75,
    marginTop: 4,
  },
  weatherHud: {
    position: 'fixed',
    top: 'calc(16px + env(safe-area-inset-top, 0px))',
    right: 16,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(0,0,0,0.6)',
    padding: '10px 16px',
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
  },
  weatherIcon: { fontSize: 32, lineHeight: 1 },
  weatherTemp: { fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  weatherLabel: { fontSize: 13, opacity: 0.8 },
  recordsBtn: {
    position: 'fixed',
    top: 'calc(80px + env(safe-area-inset-top, 0px))',
    right: 16,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 14px',
    zIndex: 10,
    cursor: 'pointer',
  },
  treeInfo: {
    position: 'fixed',
    bottom: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    background: 'rgba(30, 70, 30, 0.85)',
    padding: '10px 20px',
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
    transition: 'opacity 0.3s',
    opacity: 0,
    whiteSpace: 'nowrap',
  },
  cameraModeHud: {
    position: 'fixed',
    bottom: 60,
    right: 16,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    zIndex: 10,
    background: 'rgba(0,0,0,0.5)',
    padding: '8px 14px',
    borderRadius: 8,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
  controls: {
    position: 'fixed',
    bottom: 60,
    left: 16,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    zIndex: 10,
    background: 'rgba(0,0,0,0.4)',
    padding: '6px 10px',
    borderRadius: 8,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
};
