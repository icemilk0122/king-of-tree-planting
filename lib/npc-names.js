const TITLES = {
  '榕樹': ['榕爺爺', '老榕', '大榕'],
  '茄苳': ['茄苳伯', '老茄苳', '茄苳大叔'],
  '樟樹': ['樟爺爺', '老樟', '樟樹阿公'],
  '楓香': ['楓香姊', '紅葉', '楓香小姐'],
  '臺灣欒樹': ['欒樹阿姨', '金黃欒', '欒樹媽媽'],
  '白千層': ['千層叔', '白衣士', '千層伯'],
  '黑板樹': ['黑板先生', '板樹大叔', '黑板兄'],
  '小葉欖仁': ['欖仁哥', '小欖仁', '欖仁叔'],
  '大花紫薇': ['紫薇姐', '花薇', '紫薇小姐'],
  '水黃皮': ['黃皮伯', '水黃', '黃皮大叔'],
  '光蠟樹': ['蠟樹哥', '光蠟兄', '蠟樹小弟'],
  '苦楝': ['苦楝阿姨', '楝花姐', '苦楝大姐'],
  '大王椰子': ['椰王', '大王', '椰子大帝'],
  '木棉': ['木棉姐', '紅棉', '木棉大姐'],
  '菩提樹': ['菩提師父', '菩提爺', '菩提仙'],
  '山櫻花': ['櫻花妹', '山櫻', '櫻花小姐'],
  '紫薇': ['紫薇', '薇薇', '小紫'],
  '阿勃勒': ['金雨哥', '勃勒叔', '黃金雨'],
};

const DEFAULT_TITLES = ['大樹伯', '老樹', '樹精靈', '護樹者', '綠蔭守護'];

const SUFFIXES = ['守護者', '觀察員', '老朋友', '鄰居', '前輩'];

export function generateNpcName(species, region) {
  const titles = TITLES[species] || DEFAULT_TITLES;
  const title = titles[Math.floor(Math.random() * titles.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const location = region ? `・${region}${suffix}` : '';
  return `${title}${location}`;
}

const DIALOGUES = {
  general: [
    '好久沒人來看我了…路過的話，幫我拍張全樹照吧。',
    '嘿！在這站了好多年了，幫我留個影吧？',
    '風吹日曬的，偶爾也想被記錄一下呢。',
    '你好你好，難得有人注意到我。幫忙拍張照吧？',
    '樹也是需要被看見的！來，幫我拍一張。',
  ],
  special: [
    '這是特別委託！我可是這一帶的老朋友了，最近需要特別關注。',
    '聽說有人專門來找我！我很重要的喔，幫我拍張近照吧。',
    '特別任務！我最近狀況有點不一樣，能幫我記錄下來嗎？',
  ],
};

export function generateDialogue(questType) {
  const pool = questType === 'special' ? DIALOGUES.special : DIALOGUES.general;
  return pool[Math.floor(Math.random() * pool.length)];
}
