import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_OUTFIT, EQUIP_SLOTS, loadOutfit, normalizeOutfit, saveOutfit } from '../lib/equipment.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    value: key => values.get(key),
  };
}

test('new players receive the complete guardian outfit', () => {
  globalThis.localStorage = memoryStorage();
  assert.deepEqual(loadOutfit(), DEFAULT_OUTFIT);
  assert.deepEqual(Object.keys(loadOutfit()), EQUIP_SLOTS);
});

test('legacy sparse saves keep omitted slots empty and create a backup', () => {
  const legacy = JSON.stringify({ hair: 'hair-default', face: null });
  const storage = memoryStorage({ 'walk-game-outfit-v2': legacy });
  globalThis.localStorage = storage;

  const outfit = loadOutfit();
  assert.equal(outfit.hair, 'hair-default');
  assert.equal(outfit.hat, null);
  assert.equal(outfit.top, null);
  assert.equal(storage.value('walk-game-outfit-v2:legacy-backup'), legacy);
});

test('invalid equipment is rejected and saves use the versioned envelope', () => {
  const storage = memoryStorage();
  globalThis.localStorage = storage;
  assert.equal(normalizeOutfit({ hair: 'hat-straw' }).hair, null);
  assert.equal(saveOutfit({ hair: 'hair-default' }), true);
  const saved = JSON.parse(storage.value('walk-game-outfit-v2'));
  assert.equal(saved.schemaVersion, 2);
  assert.equal(saved.slots.hair, 'hair-default');
  assert.equal(saved.slots.hat, null);
});
