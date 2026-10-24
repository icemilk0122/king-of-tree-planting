import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  CURRENT_QUEST_CONTENT_VERSION,
  LEGACY_QUEST_CONTENT_VERSION,
  isCurrentQuest,
} from '../lib/quest-version.js';

test('runtime quest version matches the current story mission pack', async () => {
  const missions = JSON.parse(await readFile(
    new URL('../content/story/v2/missions.json', import.meta.url),
    'utf8'
  ));

  assert.equal(CURRENT_QUEST_CONTENT_VERSION, missions.contentVersion);
  assert.equal(isCurrentQuest({ content_version: CURRENT_QUEST_CONTENT_VERSION }), true);
  assert.equal(isCurrentQuest({ content_version: LEGACY_QUEST_CONTENT_VERSION }), false);
  assert.equal(isCurrentQuest({}), false);
});
