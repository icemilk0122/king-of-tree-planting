import scenes from '../../content/story/v2/scenes.json';
import characters from '../../content/story/v2/characters.json';
import portraits from '../../content/story/v2/portraits.json';
import text from '../../content/story/v2/text.zh-TW.json';
import bindings from '../../content/story/v2/event-bindings.json';
import runtimeProfile from '../../content/story/v2/runtime-profile.json';
import { buildStoryCatalog } from './normalize.js';
import { createStoryDirector } from './director.js';

const catalog = buildStoryCatalog({ scenes, characters, portraits, text, runtimeProfile });

export function createCurrentStoryDirector(storage) {
  return createStoryDirector({ catalog, bindings, runtimeProfile, storage });
}
