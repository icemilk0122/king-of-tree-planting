const MASK_OPACITY = {
  none: 0,
  light: 0.3,
  medium: 0.5,
  deep: 0.7,
};

const ALLOWED_INTERPOLATION_KEYS = new Set(['points', 'totalPoints']);

export function interpolateStoryText(template, values = {}) {
  return String(template || '').replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (match, key) => {
    if (!ALLOWED_INTERPOLATION_KEYS.has(key)) return match;
    const value = values[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export function buildStoryCatalog({ scenes, characters, portraits, text, runtimeProfile }) {
  const characterById = new Map((characters.characters || []).map(item => [item.id, item]));
  const portraitById = new Map((portraits.portraits || []).map(item => [item.id, item]));
  const sceneById = new Map((scenes.scenes || []).map(item => [item.id, item]));
  const enabledScenes = new Set(runtimeProfile.enabledScenes || []);
  const resolvedText = { ...(text.base || {}), ...(runtimeProfile.text || {}) };

  return {
    enabledScenes,
    sceneById,
    normalize(sceneId, values = {}) {
      const scene = sceneById.get(sceneId);
      if (!scene || !enabledScenes.has(sceneId)) return null;
      return {
        id: scene.id,
        title: scene.title,
        returnTo: scene.returnTo,
        inputPolicy: scene.inputPolicy,
        pages: (scene.pages || []).map(page => {
          const character = characterById.get(page.characterId);
          const portrait = page.portraitId ? portraitById.get(page.portraitId) : null;
          const portraitAvailable = portrait?.availability === 'available' && portrait.resolvedLocalPath;
          return {
            id: page.id,
            speaker: character?.displayName || page.characterId || '系統提示',
            text: interpolateStoryText(resolvedText[page.textKey] || page.textKey, values),
            hint: page.uiHintKey ? interpolateStoryText(resolvedText[page.uiHintKey] || '', values) : null,
            overlay: MASK_OPACITY[page.backgroundMask] ?? MASK_OPACITY.medium,
            portraitSide: portrait?.dialogueSide || (page.portraitEntrance === 'right' ? 'right' : 'left'),
            portrait: page.portraitId ? {
              type: portraitAvailable ? 'image' : 'name-card',
              src: portraitAvailable ? portrait.resolvedLocalPath : null,
              label: character?.displayName || page.characterId,
              disclosure: portrait?.disclosure || character?.fictionDisclosure || null,
              facing: portrait?.facing || null,
              mirrorX: portrait?.mirrorX === true,
            } : null,
          };
        }),
      };
    },
  };
}
