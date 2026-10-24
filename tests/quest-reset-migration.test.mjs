import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('new game rotates the anonymous player identity without deleting shared data', async () => {
  const source = await readFile(new URL('../lib/quest-engine.js', import.meta.url), 'utf8');
  const resetBody = source.slice(source.indexOf('export async function resetUserData'));

  assert.match(resetBody, /resetDeviceId\(\)/);
  assert.doesNotMatch(resetBody, /\.delete\(/);
  assert.doesNotMatch(resetBody, /rpc\('reset_user_game_data'/);
});

test('quest completion is derived from the current player participation', async () => {
  const source = await readFile(new URL('../lib/quest-engine.js', import.meta.url), 'utf8');
  const activeQuestBody = source.slice(
    source.indexOf('export async function getActiveQuests'),
    source.indexOf('export async function getQuestsForTree')
  );

  assert.match(source, /withUserCompletionState/);
  assert.match(source, /completedQuestIds\.has\(quest\.id\)/);
  assert.doesNotMatch(activeQuestBody, /eq\('satisfied', false\)/);
});
