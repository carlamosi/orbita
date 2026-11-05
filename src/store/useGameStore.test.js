import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Rating, State } from '../srs/scheduler.js'
import { freshV2 } from '../srs/migrate.js'

const T0 = Date.parse('2026-11-05T10:00:00+01:00')
const DAY = 86400000

async function loadStore() {
  vi.resetModules()
  const mod = await import('./useGameStore.js')
  return mod.useGameStore
}

const readV2 = () => JSON.parse(localStorage.getItem('orbita-v2')).state

describe('useGameStore v2', () => {
  let store
  beforeEach(async () => {
    localStorage.clear()
    store = await loadStore()
  })

  it('answer: one set updates card, log, daily (reviews + new) and countryProgress', () => {
    const calls = vi.fn()
    const unsub = store.subscribe(calls)
    store.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: 1500 })
    unsub()
    expect(calls).toHaveBeenCalledTimes(1)

    const s = store.getState()
    expect(s.cards['ESP:loc'].state).not.toBe(State.New)
    expect(s.cards['ESP:loc'].last_review).toBe(T0)
    expect(s.reviewLog).toEqual([['ESP:loc', Rating.Good, Math.floor(T0 / 1000), 0, 0, 1500]])
    expect(s.daily['2026-11-05']).toEqual({ reviews: 1, new: 1 })
    expect(s.dailyActivity).toEqual({ '2026-11-05': 1 })
    expect(s.countryProgress.ESP).toBeDefined()

    // persisted
    expect(readV2().cards['ESP:loc']).toEqual(s.cards['ESP:loc'])
    expect(readV2().countryProgress).toBeUndefined()
  })

  it('answer on a non-New card counts a review but not a new card', () => {
    store.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: null })
    store.getState().answer('ESP:loc', Rating.Good, T0 + 15 * 60000, { latencyMs: null })
    expect(store.getState().daily['2026-11-05']).toEqual({ reviews: 2, new: 1 })
    expect(store.getState().reviewLog).toHaveLength(2)
    expect(store.getState().reviewLog[1][5]).toBeNull()
  })

  it('answer just after midnight in Madrid counts for the new day', () => {
    const t = Date.parse('2026-11-05T23:30:00Z') // 00:30 on 2026-11-06 in Madrid
    store.getState().answer('ESP:loc', Rating.Good, t, { latencyMs: null })
    expect(Object.keys(store.getState().daily)).toEqual(['2026-11-06'])
  })

  it('recordConfusion counts and keeps at most 5 per card, dropping the lowest', () => {
    const { recordConfusion } = store.getState()
    for (const [iso, n] of [['ROU', 3], ['NER', 1], ['MLI', 2], ['BFA', 4], ['SEN', 5]]) {
      for (let i = 0; i < n; i++) recordConfusion('TCD:flag', iso)
    }
    recordConfusion('TCD:flag', 'GIN')
    recordConfusion('TCD:flag', 'GIN')
    expect(store.getState().confusions['TCD:flag']).toEqual({ ROU: 3, MLI: 2, BFA: 4, SEN: 5, GIN: 2 })
    expect(readV2().confusions['TCD:flag'].GIN).toBe(2)
  })

  it('finishSession: same day unchanged, next day +1, gap resets to 1', () => {
    const { finishSession } = store.getState()
    finishSession('find', 100, T0)
    expect(store.getState().streak).toBe(1)
    expect(store.getState().totalSessions).toBe(1)
    finishSession('find', 100, T0 + 3600000)
    expect(store.getState().streak).toBe(1)
    expect(store.getState().totalSessions).toBe(2)
    finishSession('flag', 100, T0 + DAY)
    expect(store.getState().streak).toBe(2)
    finishSession('flag', 100, T0 + 4 * DAY)
    expect(store.getState().streak).toBe(1)
    expect(store.getState().stats.lastSessionDay).toBe('2026-11-09')
    expect(readV2().stats.totalSessions).toBe(4)
  })

  it('finishSession uses the local (Madrid) day for the streak', () => {
    const { finishSession } = store.getState()
    finishSession('find', 1, Date.parse('2026-11-05T12:00:00Z'))
    finishSession('find', 1, Date.parse('2026-11-05T23:30:00Z')) // 00:30 Nov 6 Madrid
    expect(store.getState().streak).toBe(2)
  })

  it('addSpeedScore keeps the top 10; unlockPerfectContinent; incrementFlagSessions', () => {
    const s = store.getState()
    for (let i = 0; i < 12; i++) s.addSpeedScore(i, `${i}/12`, 10, 'Europe')
    expect(store.getState().speedRoundBests.map((b) => b.score)).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
    s.unlockPerfectContinent('Europe')
    expect(store.getState().challenges.perfectContinents).toEqual({ Europe: true })
    s.incrementFlagSessions()
    expect(store.getState().flagSessionsCompleted).toBe(1)
    expect(readV2().stats.flagSessionsCompleted).toBe(1)
    expect(readV2().speedRoundBests).toHaveLength(10)
  })

  it('hydration derives countryProgress and the UI fields from disk', async () => {
    store.getState().answer('ESP:cap', Rating.Good, Date.now(), { latencyMs: null })
    store.getState().finishSession('capital', 10, Date.now())
    const reloaded = await loadStore()
    const s = reloaded.getState()
    expect(s.countryProgress.ESP.capitalConf).toBeGreaterThan(0)
    expect(s.totalSessions).toBe(1)
    expect(s.streak).toBe(1)
    expect(Object.values(s.dailyActivity)).toEqual([1])
  })

  describe('deprecated adapters (removed in Task 7)', () => {
    it('updateProgress maps type to category and isWrong to Again/Good', () => {
      const { actions } = store.getState()
      actions.updateProgress('ESP', 'locationConf', 15)
      actions.updateProgress('FRA', 'capitalConf', -10, true)
      actions.updateProgress('ITA', 'flagConf', 15)
      const log = store.getState().reviewLog
      expect(log.map((e) => [e[0], e[1]])).toEqual([
        ['ESP:loc', Rating.Good],
        ['FRA:cap', Rating.Again],
        ['ITA:flag', Rating.Good],
      ])
    })

    it('incrementStreak counts a session; logSession does not double count', () => {
      const { actions } = store.getState()
      actions.logSession('find', 10)
      actions.incrementStreak()
      expect(store.getState().totalSessions).toBe(1)
      expect(store.getState().streak).toBe(1)
    })

    it('unlockChallenge("perfect_X") unlocks perfect continent X; speed and flag adapters work', () => {
      const { actions } = store.getState()
      actions.unlockChallenge('perfect_Africa', true)
      actions.addSpeedScore(42, '7/8', 12, 'Africa')
      actions.incrementFlagSessions()
      const s = store.getState()
      expect(s.challenges.perfectContinents).toEqual({ Africa: true })
      expect(s.speedRoundBests[0]).toMatchObject({ score: 42, continent: 'Africa' })
      expect(s.flagSessionsCompleted).toBe(1)
    })
  })

  it('initial state is a fresh v2 with the UI read fields', () => {
    const s = store.getState()
    const fresh = freshV2(T0)
    expect(s.schema).toBe(2)
    expect(s.settings).toEqual(fresh.settings)
    expect(s.countryProgress).toEqual({})
    expect(s.dailyActivity).toEqual({})
    expect(s.challenges).toEqual({ perfectContinents: {} })
    expect(s.storageStatus).toBe('ok')
    expect(s.needsReload).toBe(false)
  })
})
