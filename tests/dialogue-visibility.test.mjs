import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowTreeDialogue } from '../lib/dialogue-visibility.js';

const tree = { treeId: 'heritage-557' };

test('ordinary tree dialogue is visible when no story is pending', () => {
  assert.equal(shouldShowTreeDialogue({
    showDialogue: true,
    selectedTree: tree,
    currentStory: null,
    storyQueueLength: 0,
  }), true);
});

test('NPC story blocks the underlying tree quest while queued or playing', () => {
  assert.equal(shouldShowTreeDialogue({
    showDialogue: true,
    selectedTree: tree,
    currentStory: null,
    storyQueueLength: 1,
  }), false);

  assert.equal(shouldShowTreeDialogue({
    showDialogue: true,
    selectedTree: tree,
    currentStory: { id: 'S13_HERITAGE_557' },
    storyQueueLength: 0,
  }), false);
});

test('tree quest appears after the NPC story has finished', () => {
  assert.equal(shouldShowTreeDialogue({
    showDialogue: true,
    selectedTree: tree,
    currentStory: null,
    storyQueueLength: 0,
  }), true);
});
