export const HERITAGE_INDEX_URL = '/data/heritage-trees-daan.json';

export function normalizeHeritageIndex(payload) {
  if (Array.isArray(payload?.trees)) return payload.trees;
  if (!Array.isArray(payload)) return [];

  return payload.map((row, index) => ({
    lat: row[0],
    lng: row[1],
    species: row[2],
    diameter: row[3],
    height: row[4],
    treeId: row[5],
    heritageId: String(row[5] || '').replace(/^heritage-/, ''),
    heritage: true,
    dist: row[6],
    region: row[7],
    address: row[7],
    reviewFlags: [],
    photos: [],
    sourcePage: null,
    index,
  }));
}

export function getHeritagePresentation(tree) {
  if (!tree?.heritage && !String(tree?.treeId || '').startsWith('heritage-')) return null;

  const heritageId = String(tree.heritageId || tree.treeId?.replace(/^heritage-/, '') || '');
  const photo = Array.isArray(tree.photos) ? tree.photos[0] || null : null;
  const reviewFlags = Array.isArray(tree.reviewFlags) ? tree.reviewFlags : [];
  const needsReview = reviewFlags.some(flag =>
    ['species_changed', 'coordinate_changed_over_50m', 'coordinate_unavailable'].includes(flag)
  );

  return {
    heritageId,
    photo,
    sourcePage: tree.sourcePage || null,
    photoCredit: tree.photoCredit || '臺北市政府文化局｜受保護樹木資訊平臺',
    statusLabel: tree.matchStatus === 'website_only'
      ? '網站新增列管紀錄'
      : tree.catalogStatus || '受保護樹木',
    emptyMessage: needsReview
      ? '來源資料有差異，照片待核對後顯示'
      : '官方代表照尚未收錄',
  };
}
