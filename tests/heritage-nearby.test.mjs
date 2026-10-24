import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeHeritageIndex } from '../lib/heritage.js';
import {
  distanceBetweenMeters,
  filterNearbyHeritageTrees,
  formatDistance,
  getNearbyHeritageTrees,
} from '../lib/heritage-nearby.js';

async function loadTrees() {
  const source = await readFile(new URL('../public/data/heritage-trees-daan.json', import.meta.url), 'utf8');
  return normalizeHeritageIndex(JSON.parse(source));
}

test('nearby heritage trees are limited by walking radius and sorted by distance', async () => {
  const trees = await loadTrees();
  const nearby = getNearbyHeritageTrees(trees, { lat: 25.0316, lng: 121.5298 }, 500);

  assert.equal(nearby.length, 72);
  assert.equal(nearby[0].heritageId, '559');
  assert.ok(nearby.every(tree => tree.distanceMeters <= 500));
  assert.ok(nearby.every((tree, index) => index === 0 || nearby[index - 1].distanceMeters <= tree.distanceMeters));
});

test('distance and search helpers keep the catalogue useful without changing source records', async () => {
  const trees = await loadTrees();
  const nearby = getNearbyHeritageTrees(trees, { lat: 25.0316, lng: 121.5298 }, 300);
  const rubberTrees = filterNearbyHeritageTrees(nearby, '楓香');

  assert.ok(distanceBetweenMeters({ lat: 25, lng: 121 }, { lat: 25, lng: 121 }) < 0.001);
  assert.equal(rubberTrees[0].heritageId, '559');
  assert.equal(formatDistance(61.4), '61 公尺');
  assert.equal(formatDistance(1260), '1.3 公里');
});
