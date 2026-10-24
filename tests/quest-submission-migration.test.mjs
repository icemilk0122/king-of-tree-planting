import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20261024143500_fix_complete_quest_submission_ambiguity.sql',
  import.meta.url
);

test('quest submission migration qualifies names shared with output columns', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /from public\.participations as p/);
  assert.match(sql, /p\.quest_id::text = p_quest_id/);
  assert.match(sql, /coalesce\(u\.total_points, 0\)/);
  assert.doesNotMatch(sql, /where\s+user_id::text = p_user_id/);
  assert.doesNotMatch(sql, /and\s+quest_id::text = p_quest_id/);
});
