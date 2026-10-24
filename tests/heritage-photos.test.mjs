import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getHeritagePresentation, normalizeHeritageIndex } from '../lib/heritage.js';

async function loadIndex() {
  const source = await readFile(new URL('../public/data/heritage-trees-daan.json', import.meta.url), 'utf8');
  return normalizeHeritageIndex(JSON.parse(source));
}

test('Daan heritage index keeps all records and representative photos', async () => {
  const trees = await loadIndex();
  assert.equal(trees.length, 523);
  assert.equal(trees.filter(tree => tree.photos.length === 1).length, 514);
  assert.equal(trees.filter(tree => tree.photos.length === 0).length, 9);

  const tree554 = trees.find(tree => tree.heritageId === '554');
  assert.equal(getHeritagePresentation(tree554).photo.src, '/assets/heritage/554/40869.webp');
  assert.match(getHeritagePresentation(tree554).sourcePage, /\/tree\/554$/);
});

test('held and missing photos stay empty instead of borrowing another tree image', async () => {
  const trees = await loadIndex();
  const held = getHeritagePresentation(trees.find(tree => tree.heritageId === '1540'));
  const missing = getHeritagePresentation(trees.find(tree => tree.heritageId === '613'));

  assert.equal(held.photo, null);
  assert.match(held.emptyMessage, /待核對/);
  assert.equal(missing.photo, null);
  assert.match(missing.emptyMessage, /尚未收錄/);
});

test('website-only heritage records retain their public source label', async () => {
  const trees = await loadIndex();
  const added = getHeritagePresentation(trees.find(tree => tree.heritageId === '4781'));
  assert.equal(added.statusLabel, '網站新增列管紀錄');
  assert.ok(added.photo);
});
