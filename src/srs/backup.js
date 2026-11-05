import { mergeV2, pickV2 } from '../store/storageV2.js'
import { localDayKey } from './dayKey.js'
import { State } from './scheduler.js'

export class BackupError extends Error {}

// Progress backup: a JSON file holding a StateV2 (schema 2).

// Only the StateV2 fields: derived UI fields (countryProgress, streak, ...),
// storage status and actions never go into a backup.
export function exportProgress(state) {
  return JSON.stringify({ ...pickV2(state), schema: 2 })
}

export const MAX_BACKUP_CHARS = 5 * 1024 * 1024
const DAY_MS = 86400000
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/
const CARD_ID = /^[A-Z]{3}:(loc|cap|flag)$/
const fin = (v) => typeof v === 'number' && Number.isFinite(v)

function validCard(id, c, nowMs) {
  if (!CARD_ID.test(id) || !isObj(c)) return false
  if (!['due', 'stability', 'difficulty', 'scheduled_days', 'reps', 'lapses'].every((k) => fin(c[k]))) return false
  if (!Number.isInteger(c.state) || c.state < 0 || c.state > 3) return false
  // A New card has stability 0; any reviewed card must have stability > 0.
  if (c.state === State.New ? c.stability < 0 : !(c.stability > 0)) return false
  if (c.learning_steps !== undefined && !fin(c.learning_steps)) return false
  if (c.last_review !== null && !(fin(c.last_review) && c.last_review <= nowMs + DAY_MS)) return false
  if ('wrong' in c && !(Number.isInteger(c.wrong) && c.wrong >= 0)) return false
  return true
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

// Parses a backup and merges it into `current` (never replaces it), so importing
// cannot lose progress. Throws a readable Error on anything that is not a v2
// backup. Accepts a bare StateV2 or the persisted wrapper {state, version}.
export function importProgress(json, current, nowMs = Date.now()) {
  if (typeof json === 'string' && json.length > MAX_BACKUP_CHARS) {
    throw new BackupError('This backup file is too large.')
  }
  let parsed
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new BackupError('This file is not a valid progress backup.')
  }
  const imported = isObj(parsed) && isObj(parsed.state) ? parsed.state : parsed
  if (!isObj(imported) || imported.schema !== 2) {
    throw new BackupError('This progress backup has an unsupported format.')
  }
  if (!isObj(imported.cards)) {
    throw new BackupError('This progress backup is missing its cards.')
  }
  const lastDay = isObj(imported.stats) ? imported.stats.lastSessionDay : undefined
  if (lastDay != null) {
    // Not after today (local device day): a session cannot have happened tomorrow.
    if (typeof lastDay !== 'string' || !DAY_KEY.test(lastDay) || lastDay > localDayKey(nowMs)) {
      throw new BackupError('This progress backup has an invalid date.')
    }
  }
  for (const [id, card] of Object.entries(imported.cards)) {
    if (!validCard(id, card, nowMs)) throw new BackupError('This progress backup contains invalid cards.')
  }
  return mergeV2(current, imported)
}
