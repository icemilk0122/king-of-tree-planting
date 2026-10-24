const EARTH_RADIUS_METERS = 6371000;

export const HERITAGE_RADIUS_OPTIONS = Object.freeze([300, 500, 800, 1500]);

export function isValidMapCoordinate(value) {
  return Number.isFinite(value?.lat)
    && Number.isFinite(value?.lng)
    && value.lat >= -90
    && value.lat <= 90
    && value.lng >= -180
    && value.lng <= 180;
}

function toRadians(value) {
  return value * Math.PI / 180;
}

export function distanceBetweenMeters(origin, destination) {
  if (!isValidMapCoordinate(origin) || !isValidMapCoordinate(destination)) return Infinity;

  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);
  const deltaLat = lat2 - lat1;
  const deltaLng = toRadians(destination.lng - origin.lng);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function formatDistance(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) return '距離未知';
  if (distanceMeters < 1000) return `${Math.max(1, Math.round(distanceMeters))} 公尺`;
  return `${(distanceMeters / 1000).toFixed(1)} 公里`;
}

export function getNearbyHeritageTrees(trees, origin, radiusMeters = 500) {
  if (!Array.isArray(trees) || !isValidMapCoordinate(origin)) return [];

  return trees
    .map(tree => {
      const distanceMeters = distanceBetweenMeters(origin, tree);
      return {
        ...tree,
        distanceMeters,
      };
    })
    .filter(tree => tree.distanceMeters <= radiusMeters)
    .sort((left, right) => {
      if (left.distanceMeters !== right.distanceMeters) {
        return left.distanceMeters - right.distanceMeters;
      }
      return Number(left.heritageId) - Number(right.heritageId);
    });
}

export function filterNearbyHeritageTrees(trees, query) {
  const keyword = String(query || '').trim().toLocaleLowerCase('zh-TW');
  if (!keyword) return trees;

  return trees.filter(tree => [
    tree.heritageId,
    tree.treeId,
    tree.species,
    tree.address,
    tree.region,
  ].some(value => String(value || '').toLocaleLowerCase('zh-TW').includes(keyword)));
}
