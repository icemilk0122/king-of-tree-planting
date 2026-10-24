import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNpcNavigationTarget,
  getNpcPlacement,
  getNpcPlacementsForDistrict,
  NPC_PLACEMENTS,
} from '../lib/npc-placements.js';
import { lonLatToWorld } from '../lib/map.js';

test('guide Ashu waits beside the Yongkang Park starting point', () => {
  const guide = getNpcPlacement('guide-ashu');
  assert.ok(guide);
  assert.equal(guide.arrivalLat, 25.0316);
  assert.equal(guide.arrivalLng, 121.5298);
  assert.equal(guide.storyEvent, 'guide.opening_replayed');
  assert.equal(guide.modelPath, '/models/npc-guide-ashu.glb');

  const center = { lat: 25.0316, lng: 121.5298 };
  const guideWorld = lonLatToWorld(guide.lng, guide.lat, center.lng, center.lat, 17);
  const startWorld = lonLatToWorld(guide.arrivalLng, guide.arrivalLat, center.lng, center.lat, 17);
  const distance = Math.hypot(guideWorld.x - startWorld.x, guideWorld.z - startWorld.z);
  assert.ok(distance > 3 && distance < guide.interactionRadius);
});

test('street aunt has a reachable Daan story placement', () => {
  const aunt = getNpcPlacement('neighborhood-aunt');
  assert.ok(aunt);
  assert.equal(aunt.lat, 25.0298);
  assert.equal(aunt.lng, 121.5306);
  assert.equal(aunt.districtKey, 'daan');
  assert.equal(aunt.storyEvent, 'neighborhood.story_opened');
  assert.equal(aunt.modelPath, '/models/npc-neighborhood-aunt.glb');

  const center = { lat: 25.0330, lng: 121.5654 };
  const npcWorld = lonLatToWorld(aunt.lng, aunt.lat, center.lng, center.lat, 17);
  const arrivalWorld = lonLatToWorld(aunt.arrivalLng, aunt.arrivalLat, center.lng, center.lat, 17);
  const arrivalDistance = Math.hypot(npcWorld.x - arrivalWorld.x, npcWorld.z - arrivalWorld.z);
  assert.ok(arrivalDistance > 3 && arrivalDistance < aunt.interactionRadius);
});

test('two heritage-tree quests use their dedicated models and exact tree ids', () => {
  const camphor = getNpcPlacement('heritage-tree-557');
  const breadfruit = getNpcPlacement('heritage-tree-763');

  assert.deepEqual(
    {
      treeId: camphor.treeId,
      modelPath: camphor.modelPath,
      lat: camphor.lat,
      lng: camphor.lng,
      event: camphor.storyEvent,
    },
    {
      treeId: 'heritage-557',
      modelPath: '/models/npc-heritage-557.glb',
      lat: 25.0327,
      lng: 121.5303,
      event: 'tree.interacted',
    }
  );
  assert.deepEqual(
    {
      treeId: breadfruit.treeId,
      modelPath: breadfruit.modelPath,
      lat: breadfruit.lat,
      lng: breadfruit.lng,
      event: breadfruit.storyEvent,
    },
    {
      treeId: 'heritage-763',
      modelPath: '/models/npc-heritage-763.glb',
      lat: 25.0306,
      lng: 121.5293,
      event: 'tree.interacted',
    }
  );

  for (const tree of [camphor, breadfruit]) {
    assert.equal(tree.markerKind, 'quest');
    assert.equal(tree.districtKey, 'daan');
    assert.equal(tree.tree.treeId, tree.treeId);
    const npcWorld = lonLatToWorld(tree.lng, tree.lat, 121.5298, 25.0316, 17);
    const arrivalWorld = lonLatToWorld(tree.arrivalLng, tree.arrivalLat, 121.5298, 25.0316, 17);
    const distance = Math.hypot(npcWorld.x - arrivalWorld.x, npcWorld.z - arrivalWorld.z);
    assert.ok(distance > 3 && distance < tree.interactionRadius);
  }
});

test('NPC placement ids and coordinates are unique', () => {
  assert.equal(new Set(NPC_PLACEMENTS.map(npc => npc.id)).size, NPC_PLACEMENTS.length);
  assert.equal(new Set(NPC_PLACEMENTS.map(npc => `${npc.lat},${npc.lng}`)).size, NPC_PLACEMENTS.length);
});

test('nearby stories are district scoped and produce NPC navigation targets', () => {
  const daanStories = getNpcPlacementsForDistrict('daan');
  assert.equal(daanStories.length, 4);
  assert.deepEqual(getNpcPlacementsForDistrict('xinyi'), []);

  const guide = getNpcPlacement('guide-ashu');
  const target = createNpcNavigationTarget(guide);
  assert.equal(target.kind, 'npc-story');
  assert.equal(target.npc_id, 'guide-ashu');
  assert.equal(target.npc_name, '阿樹');
  assert.equal(target.npc.id, 'guide-ashu');
});
