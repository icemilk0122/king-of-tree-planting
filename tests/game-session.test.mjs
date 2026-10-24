import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPENING_STORY_POSITION,
  PLAYER_POSITION_KEY,
  readPlayerPosition,
  resetLocalGameSession,
} from '../lib/game-session.js';

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

test('new game clears the old position and resets story progress locally', () => {
  const storage = memoryStorage({
    [PLAYER_POSITION_KEY]: JSON.stringify({ lat: 25.05, lng: 121.52 }),
    'walk-game-device-id': 'old-device',
    'walk-game-outfit': '{}',
  });
  let storyReset = false;

  resetLocalGameSession(storage, { reset: () => { storyReset = true; } });

  assert.equal(storage.getItem(PLAYER_POSITION_KEY), null);
  assert.equal(storage.getItem('walk-game-device-id'), null);
  assert.equal(storage.getItem('walk-game-outfit'), null);
  assert.equal(storyReset, true);
});

test('opening story position is a valid explicit restart point', () => {
  assert.equal(Number.isFinite(OPENING_STORY_POSITION.lat), true);
  assert.equal(Number.isFinite(OPENING_STORY_POSITION.lng), true);
});

test('stored player position rejects malformed coordinates', () => {
  const valid = memoryStorage({
    [PLAYER_POSITION_KEY]: JSON.stringify({ lat: 25.033, lng: 121.5654 }),
  });
  const invalid = memoryStorage({
    [PLAYER_POSITION_KEY]: JSON.stringify({ lat: '25.033', lng: null }),
  });

  assert.deepEqual(readPlayerPosition(valid), { lat: 25.033, lng: 121.5654 });
  assert.equal(readPlayerPosition(invalid), null);
});
