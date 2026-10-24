export const DEVICE_ID_STORAGE_KEY = 'shade-keepers-device-id';

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (id) return id;
    id = 'dev-' + crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
    return id;
  } catch {
    return 'dev-' + Math.random().toString(36).slice(2, 15);
  }
}

export function resetDeviceId() {
  try {
    localStorage.removeItem(DEVICE_ID_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}
