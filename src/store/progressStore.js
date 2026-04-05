/**
 * progressStore.js
 *
 * Lightweight store (no external lib) for Orbita learning progress.
 * All state lives in localStorage via the useLocalStorage hook.
 *
 * Keys stored:
 *   orbita_confidence   — Record<countryId, { location, capital, flag }>  (0–5 scale)
 *   orbita_sessions     — number
 *   orbita_streak       — { count, lastDate }
 *   orbita_history      — Record<date, number>  (daily session counts for heatmap)
 */

export const STORE_KEYS = {
  CONFIDENCE: 'orbita_confidence',
  SESSIONS:   'orbita_sessions',
  STREAK:     'orbita_streak',
  HISTORY:    'orbita_history',
}

/** Initial confidence shape for a country */
export function defaultConfidence() {
  return { location: 0, capital: 0, flag: 0 }
}
