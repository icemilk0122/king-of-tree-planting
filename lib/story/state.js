export const STORY_PROGRESS_KEY = 'tree-guardians-story-progress:v1';

function emptyProgress() {
  return { schemaVersion: 1, consumedKeys: [] };
}

export function createStoryProgressStore(storage) {
  function read() {
    if (!storage) return emptyProgress();
    try {
      const parsed = JSON.parse(storage.getItem(STORY_PROGRESS_KEY));
      if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.consumedKeys)) {
        return emptyProgress();
      }
      return parsed;
    } catch {
      return emptyProgress();
    }
  }

  function write(progress) {
    if (!storage) return;
    try { storage.setItem(STORY_PROGRESS_KEY, JSON.stringify(progress)); } catch {}
  }

  return {
    has(key) {
      return read().consumedKeys.includes(key);
    },
    consume(key) {
      const progress = read();
      if (progress.consumedKeys.includes(key)) return false;
      write({ ...progress, consumedKeys: [...progress.consumedKeys, key] });
      return true;
    },
    reset() {
      try { storage?.removeItem(STORY_PROGRESS_KEY); } catch {}
    },
  };
}
