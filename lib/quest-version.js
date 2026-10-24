export const CURRENT_QUEST_CONTENT_VERSION = '2.0-review.1';
export const LEGACY_QUEST_CONTENT_VERSION = 'legacy-v1';

export function isCurrentQuest(quest) {
  return quest?.content_version === CURRENT_QUEST_CONTENT_VERSION;
}
