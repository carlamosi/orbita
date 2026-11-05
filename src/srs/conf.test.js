import { describe, it, expect } from 'vitest'
import { State, newCard } from './scheduler.js'
import { cardConf, materializeProgress, MASTERED } from './conf.js'

const T0 = Date.UTC(2026, 0, 10, 12, 0, 0)
const DAY = 86400000

function reviewed(stability, lapses = 0) {
  return {
    ...newCard(T0),
    state: State.Review,
    stability,
    difficulty: 5,
    reps: 3,
    lapses,
    last_review: T0,
    scheduled_days: Math.round(stability),
    due: T0 + stability * DAY,
  }
}

describe('cardConf', () => {
  it('is 0 for missing and New cards', () => {
    expect(cardConf(undefined, T0)).toBe(0)
    expect(cardConf(newCard(T0), T0)).toBe(0)
  })
  it('is an integer in [0,100]', () => {
    for (const s of [0.1, 1, 7, 21, 365, 5000]) {
      for (const d of [0, 1, 30, 1000]) {
        const v = cardConf(reviewed(s), T0 + d * DAY)
        expect(Number.isInteger(v)).toBe(true)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
    }
  })
  it('does not grow as now advances without reviews', () => {
    const c = reviewed(7)
    let prev = Infinity
    for (let d = 0; d <= 60; d += 3) {
      const v = cardConf(c, T0 + d * DAY)
      expect(v).toBeLessThanOrEqual(prev)
      prev = v
    }
  })
  it('S=7 with R>=0.9 gives >= MASTERED', () => {
    expect(MASTERED).toBe(60)
    expect(cardConf(reviewed(7), T0)).toBeGreaterThanOrEqual(60)
    expect(cardConf(reviewed(7), T0 + 6 * DAY)).toBeGreaterThanOrEqual(60)
  })
})

describe('materializeProgress', () => {
  it('only includes countries with at least one card and sums lapses', () => {
    const cards = {
      'ESP:loc': reviewed(7, 1),
      'ESP:cap': reviewed(7, 2),
      'ESP:flag': newCard(T0),
      'FRA:flag': reviewed(21, 0),
      'XXX:other': reviewed(7, 9),
    }
    const p = materializeProgress(cards, T0)
    expect(Object.keys(p).sort()).toEqual(['ESP', 'FRA'])
    expect(p.ESP.locationConf).toBeGreaterThanOrEqual(60)
    expect(p.ESP.capitalConf).toBeGreaterThanOrEqual(60)
    expect(p.ESP.flagConf).toBe(0)
    expect(p.ESP.timesWrong).toBe(3)
    expect(p.FRA.locationConf).toBe(0)
    expect(p.FRA.flagConf).toBeGreaterThanOrEqual(60)
    expect(materializeProgress({}, T0)).toEqual({})
  })
})
