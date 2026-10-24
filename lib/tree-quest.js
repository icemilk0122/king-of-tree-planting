import { generateDialogue } from './npc-names.js';
import { CURRENT_QUEST_CONTENT_VERSION } from './quest-version.js';

const GENERAL_POINTS = 10;

export function getTreeInteractionName(tree) {
  const npcName = String(tree?.npcName || '').trim();
  if (npcName) return npcName;

  const species = String(tree?.species || '樹').trim() || '樹';
  const region = String(tree?.region || '').trim();
  return region ? `${species}・${region}` : species;
}

export function createTreeQuestDraft(tree, areaId, options = {}) {
  const treeId = String(tree?.treeId || '').trim();
  if (!treeId) throw new Error('Tree id is required to create a quest');

  const species = String(tree?.species || '樹').trim() || '樹';
  const region = String(tree?.region || '').trim();
  const dialogue = options.dialogue || generateDialogue('general');

  return {
    tree_id: treeId,
    quest_type: 'general',
    title: `${species}守護任務`,
    description: dialogue,
    npc_name: options.npcName || tree?.npcName || null,
    npc_dialogue: dialogue,
    points: GENERAL_POINTS,
    area_id: areaId || null,
    content_version: CURRENT_QUEST_CONTENT_VERSION,
    is_active: true,
    satisfied: false,
    evidence_kind: 'whole_tree',
  };
}
