export const PLAYER_POSITION_KEY = 'walk-game-player-pos';

export const OPENING_STORY_POSITION = Object.freeze({
  lat: 25.0330,
  lng: 121.5654,
});

const LOCAL_NEW_GAME_KEYS = [
  'walk-game-device-id',
  'walk-game-intro-seen',
  PLAYER_POSITION_KEY,
  'walk-game-outfit',
];

export function resetLocalGameSession(storage, storyDirector) {
  for (const key of LOCAL_NEW_GAME_KEYS) {
    storage?.removeItem(key);
  }
  storyDirector?.reset?.();
}

export function readPlayerPosition(storage) {
  try {
    const saved = storage?.getItem(PLAYER_POSITION_KEY);
    if (!saved) return null;
    const position = JSON.parse(saved);
    if (!Number.isFinite(position?.lat) || !Number.isFinite(position?.lng)) return null;
    return { lat: position.lat, lng: position.lng };
  } catch {
    return null;
  }
}
