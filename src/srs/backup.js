import { mergeV2 } from '../store/storageV2.js'

// Progress backup: a JSON file holding a StateV2 (schema 2).

export function exportProgress(state) {
  return JSON.stringify({ ...state, schema: 2 })
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

// Parses a backup and merges it into `current` (never replaces it), so importing
// cannot lose progress. Throws a readable Error on anything that is not a v2
// backup. Accepts a bare StateV2 or the persisted wrapper {state, version}.
export function importProgress(json, current) {
  let parsed
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('This file is not a valid progress backup.')
  }
  const imported = isObj(parsed) && isObj(parsed.state) ? parsed.state : parsed
  if (!isObj(imported) || imported.schema !== 2) {
    throw new Error('This progress backup has an unsupported format.')
  }
  if (!isObj(imported.cards)) {
    throw new Error('This progress backup is missing its cards.')
  }
  return mergeV2(current, imported)
}
