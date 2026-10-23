const STORAGE_KEY = 'shade-keepers-device-id';

export function getDeviceId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (id) return id;
    id = 'dev-' + crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return 'dev-' + Math.random().toString(36).slice(2, 15);
  }
}
