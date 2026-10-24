export const NPC_INTERACTION_SOURCE = Object.freeze({
  PROMPT: 'prompt',
  KEYBOARD: 'keyboard',
  WORLD: 'world',
  NAVIGATION: 'navigation',
});

export function shouldStartNpcInteraction(source) {
  return source === NPC_INTERACTION_SOURCE.PROMPT
    || source === NPC_INTERACTION_SOURCE.KEYBOARD
    || source === NPC_INTERACTION_SOURCE.WORLD;
}
