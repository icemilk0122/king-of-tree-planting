'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initGame } from '../lib/engine';
import RPGDialogue from './quest/RPGDialogue';
import ActionBar from './hud/ActionBar';
import { getOrCreateQuestForTree, acceptQuest, toggleFollowTree, startRelay, resetUserData } from '../lib/quest-engine';
import { detectDistrict, detectDistrictFromAddress } from '../lib/area-detect';
import PhotoCapture from './photo/PhotoCapture';
import NearbyQuests from './quest/NearbyQuests';
import MyRecords from './records/MyRecords';
import DistrictMap from './map/DistrictMap';
import FollowedTrees from './social/FollowedTrees';
import PlantProposal from './social/PlantProposal';
import CommunityFeed from './social/CommunityFeed';
import TitleScreen from './title/TitleScreen';
import StoryPlayer from './story/StoryPlayer';
import { createCurrentStoryDirector } from '../lib/story';
import VirtualJoystick from './hud/VirtualJoystick';
import QuestNav from './hud/QuestNav';
import Wardrobe from './hud/Wardrobe';
import { OPENING_STORY_POSITION, resetLocalGameSession } from '../lib/game-session';
import { shouldShowTreeDialogue } from '../lib/dialogue-visibility';

export default function Game() {
  const containerRef = useRef(null);
  const coordRef = useRef(null);
  const treeInfoRef = useRef(null);
  const gameRef = useRef(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [selectedTree, setSelectedTree] = useState(null);
  const [treeQuest, setTreeQuest] = useState(null);
  const [weather, setWeather] = useState(null);
  const [address, setAddress] = useState('');
  const [cameraMode, setCameraMode] = useState('');
  const [weatherSimOn, setWeatherSimOn] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [questLoading, setQuestLoading] = useState(false);
  const [currentDistrict, setCurrentDistrict] = useState('xinyi');
  const [navQuest, setNavQuest] = useState(null);
  const [storyQueue, setStoryQueue] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [appearanceSnapshot, setAppearanceSnapshot] = useState(null);
  const [nearbyNpc, setNearbyNpc] = useState(null);
  const storyDirectorRef = useRef(null);
  const initialPlayerCoordsRef = useRef(null);
  const currentDistrictRef = useRef(currentDistrict);

  useEffect(() => {
    currentDistrictRef.current = currentDistrict;
  }, [currentDistrict]);

  const getStoryDirector = useCallback(() => {
    if (!storyDirectorRef.current && typeof window !== 'undefined') {
      storyDirectorRef.current = createCurrentStoryDirector(window.localStorage);
    }
    return storyDirectorRef.current;
  }, []);

  const emitStoryEvent = useCallback((eventName, payload = {}) => {
    const story = getStoryDirector()?.emit(eventName, payload);
    if (story) setStoryQueue(queue => [...queue, story]);
    return story;
  }, [getStoryDirector]);

  const onTreeClick = useCallback(async (data) => {
    if (!data) {
      setSelectedTree(null);
      setShowDialogue(false);
      return;
    }
    const liveTreeData = gameRef.current?.getTreeData?.(data.treeId);
    const treeData = { ...(liveTreeData || {}), ...data };
    setSelectedTree(treeData);
    setTreeQuest(null);
    setShowDialogue(true);
    setQuestLoading(true);
    try {
      const quest = await getOrCreateQuestForTree(treeData, currentDistrictRef.current);
      setTreeQuest(quest);
    } catch (e) {
      console.warn('Quest fetch or creation failed:', e);
    }
    setQuestLoading(false);
  }, []);

  const onNpcInteract = useCallback((npc) => {
    if (npc.tree) {
      onTreeClick({
        ...npc.tree,
        npcId: npc.id,
        npcName: npc.name,
      });
    }
    emitStoryEvent(npc.storyEvent, {
      areaId: npc.districtKey,
      npcId: npc.id,
      treeId: npc.treeId,
    });
  }, [emitStoryEvent, onTreeClick]);

  const syncQuestMarkersForDistrict = useCallback((districtKey) => {
    if (!districtKey) return;
    // Regular tree quests are discovered through interaction and the nearby list.
    // Only actual NPC models own an exclamation marker, rendered by NpcManager.
    gameRef.current?.setQuestTreeIds([]);
  }, []);

  const onWeatherUpdate = useCallback((data) => {
    setWeather(data);
  }, []);

  const onAddressUpdate = useCallback((addr) => {
    setAddress(addr);
    if (gameRef.current) {
      const coords = gameRef.current.getPlayerCoords();
      const district = detectDistrictFromAddress(addr) || detectDistrict(coords.lat, coords.lng);
      if (district) {
        setCurrentDistrict(district);
        syncQuestMarkersForDistrict(district);
      }
    }
  }, [syncQuestMarkersForDistrict]);

  const onCameraModeChange = useCallback((label) => {
    setCameraMode(label);
  }, []);

  const moveJoystickRef = useRef(null);
  const rotJoystickRef = useRef(null);

  const onMoveJoystick = useCallback((dx, dy) => {
    moveJoystickRef.current = { dx, dy };
    const rotDx = rotJoystickRef.current?.dx || 0;
    gameRef.current?.setJoystickInput(dx, dy, rotDx);
  }, []);

  const onRotJoystick = useCallback((dx, _dy) => {
    rotJoystickRef.current = { dx };
    const move = moveJoystickRef.current || { dx: 0, dy: 0 };
    gameRef.current?.setJoystickInput(move.dx, move.dy, dx);
  }, []);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (!gameStarted || !containerRef.current || gameRef.current) return;
    gameRef.current = initGame(
      containerRef.current, coordRef.current, treeInfoRef.current,
      onTreeClick, onWeatherUpdate, onAddressUpdate, onCameraModeChange,
      {
        onAppearanceChange: setAppearanceSnapshot,
        onNpcInteract,
        onNpcProximityChange: setNearbyNpc,
        initialPlayerCoords: initialPlayerCoordsRef.current,
      }
    );
    initialPlayerCoordsRef.current = null;
    return () => {
      if (gameRef.current?.cleanup) {
        gameRef.current.cleanup();
        gameRef.current = null;
      }
    };
  }, [gameStarted, onTreeClick, onWeatherUpdate, onAddressUpdate, onCameraModeChange, onNpcInteract]);

  useEffect(() => {
    const blocked = !!currentStory || showDialogue || !!activePanel;
    gameRef.current?.setInputBlocked?.(blocked);
    if (blocked) {
      moveJoystickRef.current = { dx: 0, dy: 0 };
      rotJoystickRef.current = { dx: 0 };
      gameRef.current?.setJoystickInput?.(0, 0, 0);
    }
  }, [currentStory, showDialogue, activePanel]);

  useEffect(() => {
    if (currentStory || storyQueue.length === 0) return;
    setCurrentStory(storyQueue[0]);
    setStoryQueue(queue => queue.slice(1));
  }, [currentStory, storyQueue]);

  useEffect(() => {
    if (!gameStarted) return;
    const timer = setTimeout(() => {
      if (!gameRef.current) return;
      const coords = gameRef.current.getPlayerCoords();
      const district = detectDistrict(coords.lat, coords.lng);
      if (district) {
        setCurrentDistrict(district);
        syncQuestMarkersForDistrict(district);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [gameStarted, syncQuestMarkersForDistrict]);

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
    } else if (action === 'relay') {
      if (treeQuest && selectedTree?.treeId) {
        try {
          await startRelay(treeQuest.id, selectedTree.treeId, currentDistrict);
        } catch (e) {
          console.warn('Start relay failed:', e);
        }
      }
      setShowDialogue(false);
      setActivePanel('records');
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

  function startIntroSequence() {
    emitStoryEvent('game.new_started');
  }

  function handleStoryComplete() {
    setCurrentStory(null);
  }

  async function handleTitleReset() {
    try {
      await resetUserData();
    } catch (e) {
      console.warn('Remote reset failed; starting a fresh local game:', e);
    } finally {
      resetLocalGameSession(window.localStorage, getStoryDirector());
      initialPlayerCoordsRef.current = OPENING_STORY_POSITION;
    }
    setGameStarted(true);
    setTimeout(startIntroSequence, 1500);
  }

  return (
    <>
      {!gameStarted && (
        <TitleScreen
          onStart={() => {
            setGameStarted(true);
            setTimeout(startIntroSequence, 1500);
          }}
          onReset={handleTitleReset}
        />
      )}
      <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />

      {/* Top-left HUD */}
      <div style={styles.hud}>
        <div style={styles.title}>樹蔭守護者</div>
        <div ref={coordRef} style={styles.coord}>25.0316, 121.5298</div>
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
          <button
            style={{
              ...styles.weatherToggle,
              background: weatherSimOn ? 'rgba(232,93,58,0.7)' : 'rgba(255,255,255,0.15)',
            }}
            onClick={() => {
              const next = !weatherSimOn;
              setWeatherSimOn(next);
              gameRef.current?.setWeatherSimEnabled(next);
            }}
            title={weatherSimOn ? '關閉天氣模擬' : '開啟天氣模擬'}
          >
            <div style={{
              ...styles.weatherToggleKnob,
              transform: weatherSimOn ? 'translateX(14px)' : 'translateX(0)',
            }} />
          </button>
        </div>
      )}

      {/* Records button */}
      <button
        style={styles.recordsBtn}
        onClick={() => setActivePanel(activePanel === 'records' ? null : 'records')}
      >
        🏆 我的紀錄
      </button>

      {/* Wardrobe button */}
      <button
        style={styles.wardrobeBtn}
        onClick={() => setActivePanel(activePanel === 'wardrobe' ? null : 'wardrobe')}
      >
        👕 換裝
      </button>

      {/* Proximity tree info */}
      <div ref={treeInfoRef} style={styles.treeInfo} />

      {nearbyNpc
        && !currentStory
        && !showDialogue
        && !activePanel
        && (nearbyNpc.treeId || getStoryDirector()?.canEmit(nearbyNpc.storyEvent, {
          areaId: nearbyNpc.districtKey,
          npcId: nearbyNpc.id,
          treeId: nearbyNpc.treeId,
        })) && (
          <button
            type="button"
            style={styles.npcPrompt}
            onClick={() => onNpcInteract(nearbyNpc)}
            aria-label={nearbyNpc.treeId ? `查看${nearbyNpc.name}任務` : `和${nearbyNpc.name}聊聊`}
          >
            <span style={styles.npcPromptIcon}>{nearbyNpc.treeId ? '❗' : '💬'}</span>
            <span>
              <span style={styles.npcPromptTitle}>
                {nearbyNpc.treeId ? `查看${nearbyNpc.name}任務` : `和${nearbyNpc.name}聊聊`}
              </span>
              <span style={styles.npcPromptHint}>
                {isTouchDevice ? '點一下開始互動' : '按 Space 或點擊目標'}
              </span>
            </span>
          </button>
        )}

      {/* Camera mode */}
      {cameraMode && (
        <div style={styles.cameraModeHud}>🎥 {cameraMode}</div>
      )}

      {/* Controls hint */}
      <div style={styles.controls}>
        WASD: 移動 &nbsp; Q/E: 旋轉 &nbsp; 滾輪: 縮放 &nbsp; V: 視角
      </div>

      {/* RPG Dialogue */}
      {shouldShowTreeDialogue({
        showDialogue,
        selectedTree,
        currentStory,
        storyQueueLength: storyQueue.length,
      }) && (
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
          areaId={currentDistrict}
          onNavigateToQuest={(q) => {
            setNavQuest(q);
            setActivePanel(null);
          }}
          onNavigateToStory={(storyTarget) => {
            setNavQuest(storyTarget);
            setActivePanel(null);
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
          onSubmitted={(result) => {
            if (selectedTree?.treeId) {
              gameRef.current?.removeQuestTreeId(selectedTree.treeId);
            }
            emitStoryEvent('quest.local_reward_committed', result);
          }}
        />
      )}

      {/* District Map */}
      {activePanel === 'map' && (
        <DistrictMap
          onTeleport={(lat, lng, districtKey) => {
            gameRef.current?.teleport(lat, lng);
            if (districtKey) {
              setCurrentDistrict(districtKey);
              setTimeout(() => syncQuestMarkersForDistrict(districtKey), 1000);
            }
          }}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* My Records Panel */}
      {activePanel === 'records' && (
        <MyRecords onClose={() => setActivePanel(null)} areaId={currentDistrict} />
      )}

      {/* Followed Trees */}
      {activePanel === 'followed' && (
        <FollowedTrees onClose={() => setActivePanel(null)} />
      )}

      {/* Plant Tree Proposal */}
      {activePanel === 'plant' && (
        <PlantProposal
          playerCoords={gameRef.current?.getPlayerCoords()}
          currentDistrict={currentDistrict}
          onClose={() => setActivePanel(null)}
          onSubmitted={(proposal) => {
            gameRef.current?.spawnSapling();
            emitStoryEvent('proposal.saved', {
              eventId: `proposal.saved:${proposal.id}`,
              proposalId: proposal.id,
              storageMode: 'supabase',
            });
          }}
        />
      )}

      {/* Community Feed */}
      {activePanel === 'community' && (
        <CommunityFeed
          areaId={currentDistrict}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Wardrobe */}
      {activePanel === 'wardrobe' && (
        <Wardrobe
          currentOutfit={appearanceSnapshot
            ? Object.fromEntries(Object.entries(appearanceSnapshot.slots).map(([slot, state]) => [slot, state.appliedId]))
            : (gameRef.current?.getOutfit() || {})}
          onApplyOutfit={(outfit) => gameRef.current?.applyOutfit(outfit)}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Story Player */}
      {currentStory && (
        <StoryPlayer story={currentStory} onComplete={handleStoryComplete} />
      )}

      {/* Quest Navigation */}
      {navQuest && (
        <QuestNav
          quest={navQuest}
          getTargetPos={() => navQuest.kind === 'npc-story'
            ? gameRef.current?.getNpcWorldPos(navQuest.npc_id)
            : gameRef.current?.getTreeWorldPos(navQuest.tree_id)}
          getPlayerPos={() => gameRef.current?.getPlayerWorldPos()}
          onArrive={() => {
            const q = navQuest;
            setNavQuest(null);
            if (q.kind === 'npc-story') {
              onNpcInteract(q.npc);
              return;
            }
            const tree = gameRef.current?.getTreeData?.(q.tree_id) || { treeId: q.tree_id };
            setTreeQuest(q);
            setSelectedTree(tree);
            setShowDialogue(true);
          }}
          onCancel={() => setNavQuest(null)}
        />
      )}

      {/* Virtual Joysticks (touch devices only) */}
      {gameStarted && isTouchDevice && !showDialogue && !activePanel && !currentStory && (
        <>
          <VirtualJoystick side="left" onInput={onMoveJoystick} />
          <VirtualJoystick side="right" onInput={onRotJoystick} />
        </>
      )}

      {/* Bottom Action Bar (hidden when dialogue or photo is open) */}
      {!showDialogue && activePanel !== 'photo' && activePanel !== 'plant' && (
        <ActionBar
          onNearbyQuests={() => setActivePanel('nearby')}
          onPhotoReport={() => setActivePanel('photo')}
          onPlantTree={() => {
            setActivePanel('plant');
            emitStoryEvent('proposal.tool_opened');
          }}
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
    color: '#FFFCF7',
    fontSize: 14,
    background: 'rgba(42,36,30,0.85)',
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
    color: '#FFFCF7',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(42,36,30,0.85)',
    padding: '10px 16px',
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
  },
  weatherIcon: { fontSize: 32, lineHeight: 1 },
  weatherTemp: { fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  weatherLabel: { fontSize: 13, opacity: 0.8 },
  weatherToggle: {
    width: 32,
    height: 18,
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.2s',
    flexShrink: 0,
    marginLeft: 4,
  },
  weatherToggleKnob: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#FFFCF7',
    transition: 'transform 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  recordsBtn: {
    position: 'fixed',
    top: 'calc(80px + env(safe-area-inset-top, 0px))',
    right: 16,
    background: 'rgba(42,36,30,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(232,93,58,0.3)',
    borderRadius: 12,
    color: '#FFFCF7',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 14px',
    zIndex: 10,
    cursor: 'pointer',
  },
  wardrobeBtn: {
    position: 'fixed',
    top: 'calc(120px + env(safe-area-inset-top, 0px))',
    right: 16,
    background: 'rgba(42,36,30,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(92,184,178,0.3)',
    borderRadius: 12,
    color: '#FFFCF7',
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
    background: 'rgba(42,36,30,0.85)',
    padding: '10px 20px',
    borderRadius: 12,
    border: '1.5px solid rgba(232,93,58,0.2)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
    transition: 'opacity 0.3s, border-color 0.3s',
    opacity: 0,
    whiteSpace: 'nowrap',
  },
  npcPrompt: {
    position: 'fixed',
    bottom: 108,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 220,
    color: '#2A241E',
    background: '#FFF8E8',
    border: '2px solid #E85D3A',
    borderRadius: 18,
    boxShadow: '0 8px 24px rgba(42,36,30,0.28)',
    padding: '10px 16px',
    zIndex: 18,
    cursor: 'pointer',
    fontFamily: 'var(--font-family)',
    textAlign: 'left',
  },
  npcPromptIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 34,
    height: 34,
    flex: '0 0 34px',
    borderRadius: 12,
    background: '#FFE3A8',
    fontSize: 18,
  },
  npcPromptTitle: {
    display: 'block',
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.25,
  },
  npcPromptHint: {
    display: 'block',
    marginTop: 2,
    color: '#756A5E',
    fontSize: 11,
    fontWeight: 600,
  },
  cameraModeHud: {
    position: 'fixed',
    bottom: 60,
    right: 16,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    zIndex: 10,
    background: 'rgba(42,36,30,0.8)',
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
    background: 'rgba(42,36,30,0.7)',
    padding: '6px 10px',
    borderRadius: 8,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
};
