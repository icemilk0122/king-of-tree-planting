import { DISTRICTS } from './districts.js';

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

export function detectDistrictFromAddress(address) {
  if (!address) return null;
  const match = DISTRICT_ENTRIES.find(([, district]) => address.includes(district.name));
  return match?.[0] || null;
}

export function resolveDistrict(address, coords) {
  const addressDistrict = detectDistrictFromAddress(address);
  if (addressDistrict) return addressDistrict;
  if (!Number.isFinite(coords?.lat) || !Number.isFinite(coords?.lng)) return null;
  return detectDistrict(coords.lat, coords.lng);
}
