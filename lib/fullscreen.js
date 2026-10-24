export function isEditableTarget(target) {
  const tagName = target?.tagName?.toLowerCase();
  return tagName === 'input'
    || tagName === 'textarea'
    || tagName === 'select'
    || Boolean(target?.isContentEditable);
}

export async function toggleFullscreen(documentRef) {
  if (!documentRef) return false;

  const fullscreenElement = documentRef.fullscreenElement || documentRef.webkitFullscreenElement;
  if (fullscreenElement) {
    const exitFullscreen = documentRef.exitFullscreen || documentRef.webkitExitFullscreen;
    if (!exitFullscreen) return false;
    await exitFullscreen.call(documentRef);
    return false;
  }

  const root = documentRef.documentElement;
  const requestFullscreen = root?.requestFullscreen || root?.webkitRequestFullscreen;
  if (!requestFullscreen) return false;
  await requestFullscreen.call(root);
  return true;
}
