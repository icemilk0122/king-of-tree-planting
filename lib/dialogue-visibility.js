export function shouldShowTreeDialogue({
  showDialogue,
  selectedTree,
  currentStory,
  storyQueueLength = 0,
}) {
  return Boolean(
    showDialogue
    && selectedTree
    && !currentStory
    && storyQueueLength === 0
  );
}
