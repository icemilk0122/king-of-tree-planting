export const EQUIP_SLOTS = ['hair', 'face', 'hat', 'top', 'bottom', 'shoes', 'acc'];

export const EQUIPMENT = {
  'hair-default':   { slot: 'hair',   name: '自然短髮',   file: 'equip-hair-default.glb' },
  'hair-neat':      { slot: 'hair',   name: '帽下短髮',   file: 'equip-hair-neat.glb' },
  'hair-spiky':     { slot: 'hair',   name: '刺蝟頭',     file: 'equip-hair-spiky.glb' },
  'face-glasses':   { slot: 'face',   name: '方框眼鏡',   file: 'equip-face-glasses.glb' },
  'face-sunglasses': { slot: 'face',  name: '平面墨鏡',   file: 'equip-face-sunglasses.glb' },
  'hat-explorer':   { slot: 'hat',    name: '探險家帽',   file: 'equip-hat-explorer.glb' },
  'hat-straw':      { slot: 'hat',    name: '草帽',       file: 'equip-hat-straw.glb' },
  'hat-cap':        { slot: 'hat',    name: '棒球帽',     file: 'equip-hat-cap.glb' },
  'top-blue':       { slot: 'top',    name: '黑白條紋上衣', file: 'equip-top-blue.glb' },
  'top-green':      { slot: 'top',    name: '綠色T恤',    file: 'equip-top-green.glb' },
  'top-vest':       { slot: 'top',    name: '背心外套',   file: 'equip-top-vest.glb' },
  'top-polo-white': { slot: 'top',    name: '守護者白色Polo衫', file: 'equip-top-polo-white.glb' },
  'top-floral':     { slot: 'top',    name: '海島花襯衫', file: 'equip-top-floral.glb' },
  'bottom-grey':    { slot: 'bottom', name: '深色長褲',   file: 'equip-bottom-grey.glb' },
  'bottom-khaki':   { slot: 'bottom', name: '卡其短褲',   file: 'equip-bottom-khaki.glb' },
  'bottom-navy':    { slot: 'bottom', name: '深藍守護者長褲', file: 'equip-bottom-navy.glb' },
  'bottom-black-shorts': { slot: 'bottom', name: '黑色休閒短褲', file: 'equip-bottom-black-shorts.glb' },
  'shoes-brown':    { slot: 'shoes',  name: '棕色皮鞋',   file: 'equip-shoes-brown.glb' },
  'shoes-sneaker':  { slot: 'shoes',  name: '白色球鞋',   file: 'equip-shoes-sneaker.glb' },
  'shoes-white':    { slot: 'shoes',  name: '全白休閒鞋', file: 'equip-shoes-white.glb' },
  'shoes-flipflops': { slot: 'shoes', name: '黑色夾腳拖', file: 'equip-shoes-flipflops.glb' },
  'acc-backpack':   { slot: 'acc',    name: '探險背包',   file: 'equip-acc-backpack.glb' },
  'acc-camera':     { slot: 'acc',    name: '相機',       file: 'equip-acc-camera.glb' },
  'acc-magnifier':  { slot: 'acc',    name: '放大鏡',     file: 'equip-acc-magnifier.glb' },
};

export const OUTFIT_PRESETS = {
  guardian: {
    name: '樹蔭守護者',
    description: '草帽、白色Polo衫與深藍長褲',
    outfit: {
      hair: 'hair-neat', face: 'face-glasses', hat: 'hat-straw', top: 'top-polo-white',
      bottom: 'bottom-navy', shoes: 'shoes-white', acc: null,
    },
  },
  classic: {
    name: '經典船長',
    description: '捲髮、條紋上衣與深色長褲',
    outfit: {
      hair: 'hair-default', face: 'face-glasses', hat: null, top: 'top-blue',
      bottom: 'bottom-grey', shoes: 'shoes-sneaker', acc: null,
    },
  },
  vacation: {
    name: '海島休閒',
    description: '花襯衫、黑短褲、夾腳拖與墨鏡',
    outfit: {
      hair: 'hair-default', face: 'face-sunglasses', hat: null, top: 'top-floral',
      bottom: 'bottom-black-shorts', shoes: 'shoes-flipflops', acc: null,
    },
  },
};

export const DEFAULT_OUTFIT = { ...OUTFIT_PRESETS.guardian.outfit };

const STORAGE_KEY = 'walk-game-outfit-v2';
const BACKUP_KEY = `${STORAGE_KEY}:legacy-backup`;

export function normalizeOutfit(outfit, { useDefault = false } = {}) {
  const source = outfit && typeof outfit === 'object' ? outfit : {};
  return Object.fromEntries(EQUIP_SLOTS.map((slot) => {
    const value = Object.prototype.hasOwnProperty.call(source, slot)
      ? source[slot]
      : (useDefault ? DEFAULT_OUTFIT[slot] : null);
    const valid = value === null || (typeof value === 'string' && EQUIPMENT[value]?.slot === slot);
    return [slot, valid ? value : null];
  }));
}

export function loadOutfit() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return normalizeOutfit(DEFAULT_OUTFIT, { useDefault: true });
    const parsed = JSON.parse(saved);
    if (parsed?.schemaVersion === 2 && parsed.slots) {
      return normalizeOutfit(parsed.slots);
    }
    // Older saves were plain objects and often omitted slots to mean "removed".
    // Preserve that intent as null instead of silently restoring default pieces.
    if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, saved);
    return normalizeOutfit(parsed);
  } catch {}
  return normalizeOutfit(DEFAULT_OUTFIT, { useDefault: true });
}

export function saveOutfit(outfit) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: 2,
      slots: normalizeOutfit(outfit),
    }));
    return true;
  } catch {
    return false;
  }
}
