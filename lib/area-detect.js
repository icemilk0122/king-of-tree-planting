import { DISTRICTS } from './districts';

const DISTRICT_ENTRIES = Object.entries(DISTRICTS);

export function detectDistrict(lat, lng) {
  let closest = null;
  let minDist = Infinity;
  for (const [key, d] of DISTRICT_ENTRIES) {
    const dlat = lat - d.lat;
    const dlng = lng - d.lng;
    const dist = dlat * dlat + dlng * dlng;
    if (dist < minDist) {
      minDist = dist;
      closest = key;
    }
  }
  return closest;
}
