import { State, retrievability } from './scheduler.js'

export const MASTERED = 60

// A country is mastered when every category (location, capital, flag) is
// >= MASTERED. One shared rule for the globe, the heatmap, Progress and Challenges.
export function isMastered(p) {
  return !!p && p.locationConf >= MASTERED && p.capitalConf >= MASTERED && p.flagConf >= MASTERED
}

const FIELD = { loc: 'locationConf', cap: 'capitalConf', flag: 'flagConf' }
const STABILITY_REF = Math.log(1 + 21)

// Legacy 0-100 confidence derived from an FSRS card:
// round(100 * R * min(1, ln(1+S) / ln(1+21))). 0 if missing or New.
export function cardConf(card, nowMs) {
  if (!card || card.state === State.New) return 0
  const r = retrievability(card, nowMs)
  const s = Math.min(1, Math.log(1 + card.stability) / STABILITY_REF)
  const v = Math.round(100 * r * s)
  return Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0))
}

// cards keyed `${ISO3}:${cat}` -> countryProgress shape used by the UI.
export function materializeProgress(cards, nowMs) {
  const out = {}
  for (const [id, card] of Object.entries(cards || {})) {
    const i = id.lastIndexOf(':')
    if (i < 0) continue
    const iso = id.slice(0, i)
    const field = FIELD[id.slice(i + 1)]
    if (!field) continue
    const p = (out[iso] ||= { locationConf: 0, capitalConf: 0, flagConf: 0, timesWrong: 0 })
    p[field] = cardConf(card, nowMs)
    // `wrong` counts every Again (New/Learning too); older cards only have lapses.
    p.timesWrong += (card.wrong ?? card.lapses) || 0
  }
  return out
}
