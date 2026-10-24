import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildStoryCatalog, interpolateStoryText } from '../lib/story/normalize.js';
import { createStoryDirector } from '../lib/story/director.js';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

async function loadStoryDocuments() {
  const base = '../content/story/v2/';
  const [scenes, characters, portraits, text, bindings, runtimeProfile] = await Promise.all([
    readJson(`${base}scenes.json`),
    readJson(`${base}characters.json`),
    readJson(`${base}portraits.json`),
    readJson(`${base}text.zh-TW.json`),
    readJson(`${base}event-bindings.json`),
    readJson(`${base}runtime-profile.json`),
  ]);
  return { scenes, characters, portraits, text, bindings, runtimeProfile };
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

test('interpolation only accepts validated reward fields', () => {
  const output = interpolateStoryText('{{points}} / {{totalPoints}} / {{unsafe}}', {
    points: 10,
    totalPoints: 30,
    unsafe: '<script>',
  });
  assert.equal(output, '10 / 30 / {{unsafe}}');
});

test('current profile normalizes masks and resolves generated standees', async () => {
  const docs = await loadStoryDocuments();
  const catalog = buildStoryCatalog(docs);
  const scene = catalog.normalize('S00_OPENING');
  assert.equal(scene.pages[0].overlay, 0.7);
  assert.equal(scene.pages[2].portrait.type, 'image');
  assert.equal(scene.pages[2].portrait.src, '/assets/story/guide-ashu-civic-volunteer.png');
  assert.equal(scene.pages[2].portraitSide, 'left');
  assert.equal(scene.pages[2].portrait.facing, 'right');
  assert.equal(scene.pages[2].portrait.mirrorX, false);
  assert.equal(scene.pages.length, 3);
  assert.match(scene.pages[2].text, /附近任務/);
  assert.match(scene.pages[2].text, /永康街樟樹/);
  assert.match(scene.pages[2].hint, /附近任務/);

  const neighborhood = catalog.normalize('S24_LOCAL_NEIGHBORHOOD');
  assert.equal(neighborhood.pages.length, 2);
  assert.equal(neighborhood.pages[0].speaker, '街坊阿姨');

  const camphor = catalog.normalize('S13_HERITAGE_557');
  const breadfruit = catalog.normalize('S14_HERITAGE_763');
  assert.equal(camphor.pages.length, 1);
  assert.equal(breadfruit.pages.length, 1);
  assert.match(camphor.pages[0].speaker, /永康街樟樹/);
  assert.match(breadfruit.pages[0].speaker, /麗水街麵包樹/);
  assert.equal(catalog.normalize('S18_CITY_PLANTING_WEEK'), null);
});

test('simplified story pack retains 30 pages and 11 enabled pages', async () => {
  const docs = await loadStoryDocuments();
  const totalPages = docs.scenes.scenes.reduce((sum, scene) => sum + scene.pages.length, 0);
  const enabledScenes = new Set(docs.runtimeProfile.enabledScenes);
  const enabledPages = docs.scenes.scenes
    .filter(scene => enabledScenes.has(scene.id))
    .reduce((sum, scene) => sum + scene.pages.length, 0);

  assert.equal(totalPages, 30);
  assert.equal(enabledPages, 11);
  assert.deepEqual(docs.runtimeProfile.enabledScenes, [
    'S00_OPENING',
    'S02_FIRST_PLANT_TOOL',
    'S05_PLANT_PROPOSAL_SAVED',
    'S13_HERITAGE_557',
    'S14_HERITAGE_763',
    'S16_GENERAL_REVIEWED',
    'S17_SPECIAL_REVIEWED',
    'S24_LOCAL_NEIGHBORHOOD',
  ]);
  assert.deepEqual(docs.runtimeProfile.text, {});
});

test('director enables only proven events and deduplicates by scope', async () => {
  const docs = await loadStoryDocuments();
  const catalog = buildStoryCatalog(docs);
  const director = createStoryDirector({
    catalog,
    bindings: docs.bindings,
    runtimeProfile: docs.runtimeProfile,
    storage: memoryStorage(),
  });

  assert.equal(director.emit('game.new_started').id, 'S00_OPENING');
  assert.equal(director.emit('game.new_started'), null);
  assert.equal(director.emit('guide.opening_replayed', { npcId: 'guide-ashu' }).id, 'S00_OPENING');
  assert.equal(director.emit('guide.opening_replayed', { npcId: 'guide-ashu' }).id, 'S00_OPENING');
  assert.equal(director.emit('proposal.saved', { storageMode: 'local', eventId: 'p0' }), null);
  assert.equal(director.emit('proposal.saved', { storageMode: 'supabase', eventId: 'p1' }).id, 'S05_PLANT_PROPOSAL_SAVED');
  assert.equal(director.emit('proposal.saved', { storageMode: 'supabase', eventId: 'p1' }), null);
  assert.equal(director.emit('proposal.saved', { storageMode: 'supabase', eventId: 'p2' }).id, 'S05_PLANT_PROPOSAL_SAVED');

  assert.equal(director.emit('tree.interacted', { treeId: 'heritage-557' }).id, 'S13_HERITAGE_557');
  assert.equal(director.emit('tree.interacted', { treeId: 'heritage-557' }).id, 'S13_HERITAGE_557');
  assert.equal(director.emit('tree.interacted', { treeId: 'heritage-763' }).id, 'S14_HERITAGE_763');
  assert.equal(director.emit('tree.interacted', { treeId: 'heritage-763' }).id, 'S14_HERITAGE_763');

  const reward = director.emit('quest.local_reward_committed', {
    eventId: 'ledger-1',
    questKind: 'general',
    points: 10,
    totalPoints: 40,
  });
  assert.equal(reward.id, 'S16_GENERAL_REVIEWED');
  assert.match(reward.pages[0].text, /10 點/);
  assert.equal(director.emit('quest.local_reward_committed', {
    eventId: 'ledger-2', questKind: 'special', points: 20, totalPoints: 60,
  }), null);
  const specialReward = director.emit('quest.local_reward_committed', {
    eventId: 'ledger-3', treeId: 'heritage-763', questKind: 'special', points: 20, totalPoints: 60,
  });
  assert.equal(specialReward.id, 'S17_SPECIAL_REVIEWED');
  assert.match(specialReward.pages[0].text, /20 點/);
  assert.equal(director.emit('campaign.opened', { campaignId: 'demo-shade-corner-week' }), null);

  assert.equal(director.canEmit('neighborhood.story_opened', { areaId: 'daan' }), true);
  assert.equal(director.emit('neighborhood.story_opened', { areaId: 'daan' }).id, 'S24_LOCAL_NEIGHBORHOOD');
  assert.equal(director.canEmit('neighborhood.story_opened', { areaId: 'daan' }), true);
  assert.equal(director.emit('neighborhood.story_opened', { areaId: 'daan' }).id, 'S24_LOCAL_NEIGHBORHOOD');
  assert.equal(director.emit('neighborhood.story_opened', { areaId: 'xinyi' }).id, 'S24_LOCAL_NEIGHBORHOOD');
  assert.equal(director.emit('neighborhood.story_opened').id, 'S24_LOCAL_NEIGHBORHOOD');
});
