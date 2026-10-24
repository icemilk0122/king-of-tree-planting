import test from 'node:test';
import assert from 'node:assert/strict';
import { createTreeQuestDraft, getTreeInteractionName } from '../lib/tree-quest.js';
import { CURRENT_QUEST_CONTENT_VERSION } from '../lib/quest-version.js';

test('every identified tree can become a complete general quest', () => {
  const quest = createTreeQuestDraft({
    treeId: 'DA123',
    species: '樟樹',
    region: '永康街',
  }, 'daan', {
    npcName: '老樟・永康街守護者',
    dialogue: '可以幫我拍張全樹照嗎？',
  });

  assert.deepEqual(quest, {
    tree_id: 'DA123',
    quest_type: 'general',
    title: '樟樹守護任務',
    description: '可以幫我拍張全樹照嗎？',
    npc_name: '老樟・永康街守護者',
    npc_dialogue: '可以幫我拍張全樹照嗎？',
    points: 10,
    area_id: 'daan',
    content_version: CURRENT_QUEST_CONTENT_VERSION,
    is_active: true,
    satisfied: false,
    evidence_kind: 'whole_tree',
  });
});

test('quest creation rejects trees without a stable id', () => {
  assert.throws(() => createTreeQuestDraft({ species: '榕樹' }, 'daan'), /Tree id is required/);
});

test('ordinary tree quests keep the tree identity instead of creating an NPC name', () => {
  const tree = {
    treeId: 'heritage-554',
    species: '榕樹',
    region: '新生南路二段',
  };

  const quest = createTreeQuestDraft(tree, 'daan', { dialogue: '幫我拍張全樹照吧！' });

  assert.equal(quest.npc_name, null);
  assert.equal(getTreeInteractionName(tree), '榕樹・新生南路二段');
});

test('explicit NPC interactions keep one stable NPC name before and after quest loading', () => {
  const tree = {
    treeId: 'heritage-557',
    species: '樟樹',
    region: '永康街13巷6號旁停車場',
    npcName: '永康街樟樹',
  };

  const quest = createTreeQuestDraft(tree, 'daan', { dialogue: '幫我拍張全樹照吧！' });

  assert.equal(quest.npc_name, '永康街樟樹');
  assert.equal(getTreeInteractionName(tree), '永康街樟樹');
});
