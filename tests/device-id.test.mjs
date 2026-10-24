import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVICE_ID_STORAGE_KEY,
  getDeviceId,
  resetDeviceId,
} from '../lib/device-id.js';

test('resetting the device identity creates a fresh anonymous player', () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };

  const first = getDeviceId();
  assert.match(first, /^dev-/);
  resetDeviceId();
  assert.equal(values.has(DEVICE_ID_STORAGE_KEY), false);

  const second = getDeviceId();
  assert.match(second, /^dev-/);
  assert.notEqual(second, first);

  delete globalThis.localStorage;
});
