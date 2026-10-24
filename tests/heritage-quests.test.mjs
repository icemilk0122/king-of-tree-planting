import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

test('current content pack maps both heritage missions to seeded runtime quests', async () => {
  const missions = JSON.parse(await read('../content/story/v2/missions.json'));
  const byId = new Map(missions.missions.map(mission => [mission.id, mission]));

  assert.equal(byId.get('M11').autoEnabled, true);
  assert.equal(byId.get('M12').currentRuntimeQuestId, '05570557-0557-4055-8055-700000000557');
  assert.equal(byId.get('M13').currentRuntimeQuestId, '07630763-0763-4076-8076-300000000763');
  assert.equal(byId.get('M12').sourceRewardPoints, 10);
  assert.equal(byId.get('M13').sourceRewardPoints, 20);
});

test('heritage quest migration seeds versioned Daan quests with the intended rewards', async () => {
  const sql = await read('../supabase/migrations/202610240003_seed_heritage_quests.sql');

  assert.match(sql, /'heritage-557'[\s\S]*?'general'[\s\S]*?10/);
  assert.match(sql, /'heritage-763'[\s\S]*?'special'[\s\S]*?20/);
  assert.match(sql, /'2\.0-review\.1'/);
  assert.match(sql, /'daan'/);
  assert.match(sql, /where not exists/);
});
