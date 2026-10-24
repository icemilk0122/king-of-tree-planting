export const EQUIP_SLOTS = ['hair', 'hat', 'top', 'bottom', 'shoes', 'acc'];

export const EQUIPMENT = {
  'hair-default':   { slot: 'hair',   name: '自然短髮',   file: 'equip-hair-default.glb' },
  'hair-spiky':     { slot: 'hair',   name: '刺蝟頭',     file: 'equip-hair-spiky.glb' },
  'hat-explorer':   { slot: 'hat',    name: '探險家帽',   file: 'equip-hat-explorer.glb' },
  'hat-straw':      { slot: 'hat',    name: '草帽',       file: 'equip-hat-straw.glb' },
  'hat-cap':        { slot: 'hat',    name: '棒球帽',     file: 'equip-hat-cap.glb' },
  'top-blue':       { slot: 'top',    name: '藍色T恤',    file: 'equip-top-blue.glb' },
  'top-green':      { slot: 'top',    name: '綠色T恤',    file: 'equip-top-green.glb' },
  'top-vest':       { slot: 'top',    name: '背心外套',   file: 'equip-top-vest.glb' },
  'bottom-grey':    { slot: 'bottom', name: '灰色長褲',   file: 'equip-bottom-grey.glb' },
  'bottom-khaki':   { slot: 'bottom', name: '卡其短褲',   file: 'equip-bottom-khaki.glb' },
  'shoes-brown':    { slot: 'shoes',  name: '棕色皮鞋',   file: 'equip-shoes-brown.glb' },
  'shoes-sneaker':  { slot: 'shoes',  name: '白色球鞋',   file: 'equip-shoes-sneaker.glb' },
  'acc-backpack':   { slot: 'acc',    name: '探險背包',   file: 'equip-acc-backpack.glb' },
  'acc-camera':     { slot: 'acc',    name: '相機',       file: 'equip-acc-camera.glb' },
  'acc-magnifier':  { slot: 'acc',    name: '放大鏡',     file: 'equip-acc-magnifier.glb' },
};

export const DEFAULT_OUTFIT = {
  hair: 'hair-default',
  hat: 'hat-explorer',
  top: 'top-blue',
  bottom: 'bottom-grey',
  shoes: 'shoes-brown',
  acc: 'acc-backpack',
};

const STORAGE_KEY = 'walk-game-outfit';

export function loadOutfit() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_OUTFIT, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_OUTFIT };
}

export function saveOutfit(outfit) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(outfit)); } catch {}
}
