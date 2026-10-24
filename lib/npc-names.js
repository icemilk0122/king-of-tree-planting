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
    '路過嗎？幫我留張全樹照吧！',
    '嘿！今天也來張合照？',
    '在這站了好多年，幫我記錄一下吧。',
    '難得你來，留張今天的模樣吧！',
    '拍一張吧，讓下個人認識我。',
  ],
  special: [
    '特別委託來啦！幫我留張近照吧！',
    '老朋友等你來，拍張全樹照吧！',
    '這張照片很重要，拜託你囉！',
  ],
};

export function generateDialogue(questType) {
  const pool = questType === 'special' ? DIALOGUES.special : DIALOGUES.general;
  return pool[Math.floor(Math.random() * pool.length)];
}
