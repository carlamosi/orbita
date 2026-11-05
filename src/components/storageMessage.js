// User-facing text for the v2 storage status (see createV2Storage in
// src/store/storageV2.js). null means storage is fine and nothing is shown.
export const STORAGE_MESSAGES = {
  needsReload: 'A newer version of Orbita saved your progress. Reload to continue.',
  notWritable: "Your progress can't be saved in this browser right now. Export a backup from Progress to keep it.",
  quota: 'Storage is full. Older review history was trimmed; export a backup from Progress.',
}

const NOT_WRITABLE = new Set(['unavailable', 'legacy-error', 'corrupt'])

export function storageMessage(storageStatus, needsReload) {
  if (needsReload || storageStatus === 'needsReload') return STORAGE_MESSAGES.needsReload
  if (NOT_WRITABLE.has(storageStatus)) return STORAGE_MESSAGES.notWritable
  if (storageStatus === 'quota-error') return STORAGE_MESSAGES.quota
  return null
}
