import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20261024145000_make_quest_completion_user_scoped.sql',
  import.meta.url
);

test('quest completion remains reusable and reset clears player-owned progress', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /create or replace function public\.reset_user_game_data/);
  assert.match(sql, /delete from public\.participations as p where p\.user_id = v_user_id/);
  assert.match(sql, /set total_points = 0/);
  assert.match(sql, /set satisfied = false/);
  assert.doesNotMatch(sql, /set satisfied = true/);
});

test('client reset uses the atomic database reset instead of RLS-blocked deletes', async () => {
  const source = await readFile(new URL('../lib/quest-engine.js', import.meta.url), 'utf8');
  const resetBody = source.slice(source.indexOf('export async function resetUserData'));

  assert.match(resetBody, /rpc\('reset_user_game_data'/);
  assert.doesNotMatch(resetBody, /from\('participations'\)\.delete/);
});
