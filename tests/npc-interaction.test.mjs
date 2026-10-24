import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NPC_INTERACTION_SOURCE,
  shouldStartNpcInteraction,
} from '../lib/npc-interaction.js';

test('NPC dialogue starts only from the visible interaction prompt', () => {
  assert.equal(shouldStartNpcInteraction(NPC_INTERACTION_SOURCE.PROMPT), true);
  assert.equal(shouldStartNpcInteraction(NPC_INTERACTION_SOURCE.KEYBOARD), false);
  assert.equal(shouldStartNpcInteraction(NPC_INTERACTION_SOURCE.WORLD), false);
  assert.equal(shouldStartNpcInteraction(NPC_INTERACTION_SOURCE.NAVIGATION), false);
  assert.equal(shouldStartNpcInteraction(undefined), false);
});
