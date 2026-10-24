import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NPC_INTERACTION_SOURCE,
  shouldStartNpcInteraction,
} from '../lib/npc-interaction.js';

test('NPC dialogue starts from manual input but not navigation arrival', () => {
  assert.equal(shouldStartNpcInteraction(NPC_INTERACTION_SOURCE.PROMPT), true);
  assert.equal(shouldStartNpcInteraction(NPC_INTERACTION_SOURCE.KEYBOARD), true);
  assert.equal(shouldStartNpcInteraction(NPC_INTERACTION_SOURCE.WORLD), true);
  assert.equal(shouldStartNpcInteraction(NPC_INTERACTION_SOURCE.NAVIGATION), false);
  assert.equal(shouldStartNpcInteraction(undefined), false);
});
