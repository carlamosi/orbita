import { describe, it, expect } from 'vitest'
import { State } from './scheduler.js'
import { cardConf, materializeProgress, MASTERED } from './conf.js'
import { migrateV0toV2, freshV2 } from './migrate.js'
import typicalRaw from './__fixtures__/v0-typical.json?raw'
import emptyRaw from './__fixtures__/v0-empty.json?raw'
import corruptRaw from './__fixtures__/v0-corrupt.txt?raw'

const NOW = Date.parse('2026-11-05T10:00:00+01:00')
const VALID = new Set(['ESP', 'FRA', 'PRT', 'DEU'])
const DAY = 86400000

const FIXTURES = { 'v0-typical.json': typicalRaw, 'v0-empty.json': emptyRaw, 'v0-corrupt.txt': corruptRaw }
const fixture = (name) => FIXTURES[name]
const typical = () => JSON.parse(fixture('v0-typical.json'))
const empty = () => JSON.parse(fixture('v0-empty.json'))

function walkNoNaN(value, path = '$') {
  if (typeof value === 'number') {
    expect(Number.isNaN(value), `NaN at ${path}`).toBe(false)
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkNoNaN(v, `${path}.${k}`)
  }
}

describe('freshV2', () => {
  it('has the StateV2 shape with defaults', () => {
    expect(freshV2(NOW)).toEqual({
      schema: 2,
      meta: { migratedFrom: null, migratedAt: NOW },
      cards: {},
      reviewLog: [],
      confusions: {},
      daily: {},
      stats: { streak: 0, lastSessionDay: null, totalSessions: 0, flagSessionsCompleted: 0 },
      speedRoundBests: [],
      challenges: { perfectContinents: {} },
      settings: { dailyNew: 10, desiredRetention: 0.9 },
    })
  })
})

describe('migrateV0toV2: typical fixture', () => {
  const v2 = migrateV0toV2(typical(), NOW, VALID)

  it('dominado antes, dominado después', () => {
    for (const cat of ['loc', 'cap', 'flag']) {
      expect(cardConf(v2.cards[`ESP:${cat}`], NOW)).toBeGreaterThanOrEqual(MASTERED)
      expect(cardConf(v2.cards[`ESP:${cat}`], NOW + 7 * DAY)).toBeGreaterThanOrEqual(MASTERED)
    }
    const p = materializeProgress(v2.cards, NOW).ESP
    expect(Math.min(p.locationConf, p.capitalConf, p.flagConf)).toBeGreaterThanOrEqual(MASTERED)
  })

  it('seeded conf is reached for 7 days and not far exceeded at day 7', () => {
    expect(cardConf(v2.cards['FRA:loc'], NOW + 7 * DAY)).toBeGreaterThanOrEqual(15)
    expect(cardConf(v2.cards['FRA:loc'], NOW + 7 * DAY)).toBeLessThanOrEqual(16)
    expect(cardConf(v2.cards['ESP:loc'], NOW + 7 * DAY)).toBeLessThanOrEqual(76)
  })

  it('seeded cards are due at round(stability) days, after nowMs', () => {
    const c = v2.cards['ESP:loc']
    expect(c.due).toBeGreaterThan(NOW)
    expect(c.scheduled_days).toBe(Math.round(c.stability))
    expect(c.due).toBe(NOW + c.scheduled_days * DAY)
  })

  it('seeds Review cards with the brief values', () => {
    const c = v2.cards['ESP:loc']
    expect(c.state).toBe(State.Review)
    expect(c.last_review).toBe(NOW)
    expect(c.difficulty).toBe(6.5)
    expect(c.stability).toBeGreaterThanOrEqual(0.5)
    expect(c.stability).toBeLessThanOrEqual(365)
  })

  it('does not create cards for Conf 0 or missing categories', () => {
    expect(v2.cards['FRA:cap']).toBeUndefined()
    expect(v2.cards['FRA:flag']).toBeUndefined()
    expect(v2.cards['PRT:cap']).toBeUndefined()
    expect(v2.cards['PRT:loc']).toBeDefined()
    expect(v2.cards['PRT:flag']).toBeDefined()
  })

  it('drops orphan GRL', () => {
    expect(Object.keys(v2.cards).some((id) => id.startsWith('GRL:'))).toBe(false)
  })

  it('materialized timesWrong equals the original per country', () => {
    const m = materializeProgress(v2.cards, NOW)
    expect(m.ESP.timesWrong).toBe(3)
    expect(m.FRA.timesWrong).toBe(2)
    expect(m.PRT.timesWrong).toBe(4)
    expect(v2.cards['ESP:loc'].lapses).toBe(3)
    expect(v2.cards['ESP:loc'].wrong).toBe(3)
    expect(v2.cards['ESP:cap'].wrong ?? 0).toBe(0)
    expect(v2.cards['ESP:cap'].lapses).toBe(0)
    expect(v2.cards['ESP:flag'].lapses).toBe(0)
  })

  it('has no NaN anywhere', () => {
    walkNoNaN(v2)
  })

  it('challenges.perfectContinents.Europe === true', () => {
    expect(v2.challenges.perfectContinents.Europe).toBe(true)
  })

  it('keeps streak, totalSessions, lastSession and dailyActivity', () => {
    expect(v2.stats.streak).toBe(4)
    expect(v2.stats.totalSessions).toBe(37)
    expect(v2.stats.flagSessionsCompleted).toBe(5)
    expect(v2.stats.lastSessionDay).toBe('2026-11-04')
    expect(v2.daily).toEqual({
      '2026-11-02': { reviews: 2, new: 0 },
      '2026-11-03': { reviews: 1, new: 0 },
      '2026-11-04': { reviews: 3, new: 0 },
    })
  })

  it('keeps speedRoundBests and records meta', () => {
    expect(v2.speedRoundBests).toHaveLength(1)
    expect(v2.speedRoundBests[0].score).toBe(12)
    expect(v2.meta).toEqual({ migratedFrom: 0, migratedAt: NOW })
    expect(v2.schema).toBe(2)
    expect(v2.reviewLog).toEqual([])
    expect(v2.confusions).toEqual({})
    expect(v2.settings).toEqual({ dailyNew: 10, desiredRetention: 0.9 })
  })

  it('accepts a bare state object too', () => {
    expect(migrateV0toV2(typical().state, NOW, VALID)).toEqual(v2)
  })

  it('is pure: does not mutate its input', () => {
    const input = typical()
    const before = JSON.stringify(input)
    migrateV0toV2(input, NOW, VALID)
    expect(JSON.stringify(input)).toBe(before)
  })
})

describe('migrateV0toV2: fix round 1', () => {
  it('keeps timesWrong of a weak spot with every Conf at 0 on a New loc card', () => {
    const v2 = migrateV0toV2(
      { countryProgress: { ESP: { locationConf: 0, capitalConf: 0, flagConf: 0, timesWrong: 5 } } },
      NOW,
      VALID,
    )
    expect(Object.keys(v2.cards)).toEqual(['ESP:loc'])
    expect(v2.cards['ESP:loc'].state).toBe(State.New)
    expect(v2.cards['ESP:loc'].lapses).toBe(5)
    expect(v2.cards['ESP:loc'].wrong).toBe(5)
    expect(cardConf(v2.cards['ESP:loc'], NOW)).toBe(0)
    expect(materializeProgress(v2.cards, NOW).ESP).toEqual({
      locationConf: 0,
      capitalConf: 0,
      flagConf: 0,
      timesWrong: 5,
    })
  })

  it('property: for conf 1..100, cardConf >= conf at nowMs and at nowMs + 7 days', () => {
    for (let conf = 1; conf <= 100; conf++) {
      const v2 = migrateV0toV2({ countryProgress: { ESP: { locationConf: conf } } }, NOW, VALID)
      const c = v2.cards['ESP:loc']
      // Target reachable unless the search hit the 365 ceiling.
      if (c.stability >= 365 && cardConf(c, NOW + 7 * DAY) < conf) continue
      expect(cardConf(c, NOW), `conf ${conf} at t0`).toBeGreaterThanOrEqual(conf)
      expect(cardConf(c, NOW + 7 * DAY), `conf ${conf} at t0+7d`).toBeGreaterThanOrEqual(conf)
    }
  })

  it('throws when validIds is not a Set or is empty', () => {
    const v0 = typical()
    expect(() => migrateV0toV2(v0, NOW, undefined)).toThrow(/validIds/)
    expect(() => migrateV0toV2(v0, NOW, ['ESP'])).toThrow(/validIds/)
    expect(() => migrateV0toV2(v0, NOW, new Set())).toThrow(/validIds/)
  })

  it('throws when nowMs is not a finite number, even for null input', () => {
    expect(() => migrateV0toV2(typical(), NaN, VALID)).toThrow(/nowMs/)
    expect(() => migrateV0toV2(typical(), undefined, VALID)).toThrow(/nowMs/)
    expect(() => migrateV0toV2(null, '2026-11-05', VALID)).toThrow(/nowMs/)
  })

  it('throws when countryProgress has entries but none is in validIds', () => {
    expect(() => migrateV0toV2(typical(), NOW, new Set(['USA', 'CAN']))).toThrow(/validIds/)
  })
})

describe('migrateV0toV2: edge cases', () => {
  it('idempotencia: a v2 object is returned as is', () => {
    const v2 = migrateV0toV2(typical(), NOW, VALID)
    expect(migrateV0toV2(v2, NOW + 1000, VALID)).toBe(v2)
  })

  it('null and undefined give freshV2', () => {
    expect(migrateV0toV2(null, NOW, VALID)).toEqual(freshV2(NOW))
    expect(migrateV0toV2(undefined, NOW, VALID)).toEqual(freshV2(NOW))
  })

  it('empty v0 fixture gives an empty v2 with migratedFrom 0', () => {
    const v2 = migrateV0toV2(empty(), NOW, VALID)
    expect(v2).toEqual({ ...freshV2(NOW), meta: { migratedFrom: 0, migratedAt: NOW } })
  })

  it('corrupt fixture is not JSON; non-object input gives freshV2', () => {
    expect(() => JSON.parse(fixture('v0-corrupt.txt'))).toThrow()
    expect(migrateV0toV2(fixture('v0-corrupt.txt'), NOW, VALID)).toEqual(freshV2(NOW))
    expect(migrateV0toV2([], NOW, VALID)).toEqual(freshV2(NOW))
  })

  it('survives malformed fields without NaN', () => {
    const v2 = migrateV0toV2(
      {
        state: {
          streak: 'x',
          totalSessions: NaN,
          lastSession: 42,
          countryProgress: {
            ESP: { locationConf: NaN, capitalConf: 250, flagConf: -5, timesWrong: 'lots' },
            DEU: null,
            FRA: { locationConf: '30', timesWrong: -3 },
          },
          dailyActivity: { 'not-a-day': 3, '2026-11-01': 'x', '2026-11-02': 4 },
          speedRoundBests: 'nope',
          challenges: { perfectContinents: { Asia: true }, perfect_: true, perfect_Africa: true },
        },
        version: 0,
      },
      NOW,
      VALID,
    )
    walkNoNaN(v2)
    expect(Object.keys(v2.cards)).toEqual(['ESP:cap'])
    expect(cardConf(v2.cards['ESP:cap'], NOW)).toBe(100)
    expect(v2.cards['ESP:cap'].lapses).toBe(0)
    expect(v2.cards['ESP:cap'].difficulty).toBe(5)
    expect(v2.stats).toEqual({ streak: 0, lastSessionDay: null, totalSessions: 0, flagSessionsCompleted: 0 })
    expect(v2.daily).toEqual({ '2026-11-02': { reviews: 4, new: 0 } })
    expect(v2.speedRoundBests).toEqual([])
    expect(v2.challenges.perfectContinents).toEqual({ Asia: true, Africa: true })
  })

  it('difficulty is clamped to 10', () => {
    const v2 = migrateV0toV2({ countryProgress: { ESP: { locationConf: 50, timesWrong: 30 } } }, NOW, VALID)
    expect(v2.cards['ESP:loc'].difficulty).toBe(10)
    expect(v2.cards['ESP:loc'].lapses).toBe(30)
  })

  it('keeps only the 400 most recent days and the first 10 speed bests', () => {
    const dailyActivity = {}
    const start = Date.UTC(2025, 0, 1)
    for (let i = 0; i < 450; i++) {
      dailyActivity[new Date(start + i * 86400000).toISOString().slice(0, 10)] = 1
    }
    const speedRoundBests = Array.from({ length: 15 }, (_, i) => ({ score: 15 - i }))
    const v2 = migrateV0toV2({ dailyActivity, speedRoundBests }, NOW, VALID)
    const keys = Object.keys(v2.daily).sort()
    expect(keys).toHaveLength(400)
    expect(keys[keys.length - 1]).toBe(new Date(start + 449 * 86400000).toISOString().slice(0, 10))
    expect(keys[0]).toBe(new Date(start + 50 * 86400000).toISOString().slice(0, 10))
    expect(v2.speedRoundBests.map((b) => b.score)).toEqual([15, 14, 13, 12, 11, 10, 9, 8, 7, 6])
  })
})
