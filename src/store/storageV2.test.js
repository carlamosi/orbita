import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mergeV2, toLogEntry, MAX_LOG } from './storageV2.js'
import { freshV2 } from '../srs/migrate.js'
import { newCard, reviewCard, Rating } from '../srs/scheduler.js'

const T0 = Date.parse('2026-11-05T10:00:00+01:00')
const KEY = 'orbita-v2'
const LEGACY = 'orbita-storage'
const BACKUP = 'orbita-storage-backup-v1'

async function loadStore() {
  vi.resetModules()
  const mod = await import('./useGameStore.js')
  return mod.useGameStore
}

const readV2 = () => JSON.parse(localStorage.getItem(KEY))

function reviewed(cardId, rating, nowMs, base = newCard(nowMs)) {
  const { card, log } = reviewCard(base, rating, nowMs, { fuzz: false })
  return { card, entry: toLogEntry(cardId, log, 1200) }
}

function v0Raw(state) {
  return JSON.stringify({ state, version: 0 })
}

describe('mergeV2', () => {
  it('merge conserva repasos de ambas pestañas', () => {
    const a = reviewed('ESP:loc', Rating.Good, T0)
    const b = reviewed('FRA:cap', Rating.Good, T0 + 5000)
    const disk = { ...freshV2(T0), cards: { 'ESP:loc': a.card }, reviewLog: [a.entry] }
    const mem = { ...freshV2(T0), cards: { 'FRA:cap': b.card }, reviewLog: [b.entry] }

    const merged = mergeV2(disk, mem)

    expect(Object.keys(merged.cards).sort()).toEqual(['ESP:loc', 'FRA:cap'])
    expect(merged.reviewLog).toEqual([a.entry, b.entry])
  })

  it('per card, the greater last_review wins (either side)', () => {
    const old = reviewed('ESP:loc', Rating.Good, T0)
    const newer = reviewed('ESP:loc', Rating.Again, T0 + 60000, old.card)
    const d = { ...freshV2(T0), cards: { 'ESP:loc': old.card } }
    const m = { ...freshV2(T0), cards: { 'ESP:loc': newer.card } }
    expect(mergeV2(d, m).cards['ESP:loc']).toEqual(newer.card)
    expect(mergeV2(m, d).cards['ESP:loc']).toEqual(newer.card)
  })

  it('reviewLog: dedup by [cardId, tsSec], sorted, capped to the 5000 most recent', () => {
    const e = (id, ts) => [id, 3, ts, 1, 5, null]
    const disk = { ...freshV2(T0), reviewLog: [e('A:loc', 10), e('B:loc', 20)] }
    const mem = { ...freshV2(T0), reviewLog: [e('B:loc', 20), e('A:loc', 5), e('A:loc', 30)] }
    expect(mergeV2(disk, mem).reviewLog.map((x) => [x[0], x[2]])).toEqual([
      ['A:loc', 5],
      ['A:loc', 10],
      ['B:loc', 20],
      ['A:loc', 30],
    ])

    const big = Array.from({ length: MAX_LOG }, (_, i) => e('A:loc', i))
    const more = Array.from({ length: 10 }, (_, i) => e('B:loc', MAX_LOG + i))
    const merged = mergeV2({ ...freshV2(T0), reviewLog: big }, { ...freshV2(T0), reviewLog: more })
    expect(merged.reviewLog).toHaveLength(MAX_LOG)
    expect(merged.reviewLog[0][2]).toBe(10)
    expect(merged.reviewLog.at(-1)).toEqual(e('B:loc', MAX_LOG + 9))
  })

  it('daily and confusions merge by max; confusions keep at most 5 per card', () => {
    const disk = {
      ...freshV2(T0),
      daily: { '2026-11-04': { reviews: 9, new: 1 }, '2026-11-05': { reviews: 3, new: 3 } },
      confusions: { 'TCD:flag': { ROU: 3, AND: 1 } },
    }
    const mem = {
      ...freshV2(T0),
      daily: { '2026-11-05': { reviews: 5, new: 2 } },
      confusions: { 'TCD:flag': { ROU: 1, NER: 2, MLI: 4, BFA: 5, SEN: 6 } },
    }
    const merged = mergeV2(disk, mem)
    expect(merged.daily).toEqual({
      '2026-11-04': { reviews: 9, new: 1 },
      '2026-11-05': { reviews: 5, new: 3 },
    })
    expect(merged.confusions['TCD:flag']).toEqual({ ROU: 3, NER: 2, MLI: 4, BFA: 5, SEN: 6 })
  })

  it('stats: streak and day from the greater lastSessionDay; monotonic counters never go down', () => {
    const disk = {
      ...freshV2(T0),
      stats: { streak: 1, lastSessionDay: '2026-11-05', totalSessions: 30, flagSessionsCompleted: 2 },
    }
    const mem = {
      ...freshV2(T0),
      stats: { streak: 7, lastSessionDay: '2026-11-04', totalSessions: 50, flagSessionsCompleted: 5 },
    }
    expect(mergeV2(disk, mem).stats).toEqual({
      streak: 1,
      lastSessionDay: '2026-11-05',
      totalSessions: 50,
      flagSessionsCompleted: 5,
    })
  })

  it('speedRoundBests: union, deduplicated, top 10; perfectContinents: OR', () => {
    const s = (score, date) => ({ score, fraction: '1/1', qpm: 10, date, continent: 'all' })
    const disk = {
      ...freshV2(T0),
      speedRoundBests: Array.from({ length: 8 }, (_, i) => s(i * 10, `d${i}`)),
      challenges: { perfectContinents: { Europe: true } },
    }
    const mem = {
      ...freshV2(T0),
      speedRoundBests: [s(70, 'd7'), s(55, 'x'), s(5, 'y'), s(65, 'z')],
      challenges: { perfectContinents: { Asia: true, Europe: false } },
    }
    const merged = mergeV2(disk, mem)
    expect(merged.speedRoundBests.map((x) => x.score)).toEqual([70, 65, 60, 55, 50, 40, 30, 20, 10, 5])
    expect(merged.challenges.perfectContinents).toEqual({ Europe: true, Asia: true })
  })

  it('tolerates missing fields', () => {
    const merged = mergeV2({ schema: 2 }, freshV2(T0))
    expect(merged.cards).toEqual({})
    expect(merged.reviewLog).toEqual([])
    expect(merged.stats.totalSessions).toBe(0)
  })
})

describe('createV2Storage + store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('migrates legacy on first load: v2 written, backup = raw legacy, legacy untouched', async () => {
    const raw = v0Raw({
      countryProgress: { ESP: { locationConf: 80, capitalConf: 0, flagConf: 0, timesWrong: 0 } },
      streak: 2,
      lastSession: '2026-11-04',
      totalSessions: 4,
    })
    localStorage.setItem(LEGACY, raw)
    const store = await loadStore()

    expect(localStorage.getItem(LEGACY)).toBe(raw)
    expect(localStorage.getItem(BACKUP)).toBe(raw)
    const v2 = readV2()
    expect(v2.version).toBe(2)
    expect(Object.keys(v2.state.cards)).toEqual(['ESP:loc'])
    expect(store.getState().countryProgress.ESP.locationConf).toBeGreaterThanOrEqual(80)
    expect(store.getState().streak).toBe(2)
    expect(store.getState().storageStatus).toBe('ok')
  })

  it('el backup se escribe una sola vez', async () => {
    const raw = v0Raw({ countryProgress: { ESP: { locationConf: 50, capitalConf: 0, flagConf: 0, timesWrong: 0 } } })
    localStorage.setItem(LEGACY, raw)
    const spy = vi.spyOn(Storage.prototype, 'setItem')

    await loadStore()
    // Even if v2 disappears, a second load must not rewrite the backup.
    localStorage.removeItem(KEY)
    await loadStore()

    const backupWrites = spy.mock.calls.filter(([k]) => k === BACKUP)
    expect(backupWrites).toHaveLength(1)
    expect(localStorage.getItem(BACKUP)).toBe(raw)
  })

  it('backup quota failure aborts the migration: in-memory only, no v2 write', async () => {
    const raw = v0Raw({ countryProgress: { ESP: { locationConf: 50, capitalConf: 0, flagConf: 0, timesWrong: 0 } } })
    localStorage.setItem(LEGACY, raw)
    const orig = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (k, v) {
      if (k === BACKUP) throw new DOMException('full', 'QuotaExceededError')
      return orig.call(this, k, v)
    })
    const store = await loadStore()
    store.getState().answer('FRA:cap', Rating.Good, T0, { latencyMs: 900 })

    expect(localStorage.getItem(KEY)).toBeNull()
    expect(localStorage.getItem(LEGACY)).toBe(raw)
    expect(store.getState().storageStatus).toBe('legacy-error')
    expect(store.getState().cards['FRA:cap']).toBeDefined()
  })

  it('migration that throws (no valid ids): legacy-error, no writes, answer works in memory', async () => {
    const raw = v0Raw({ countryProgress: { XXX: { locationConf: 50, capitalConf: 0, flagConf: 0, timesWrong: 0 } } })
    localStorage.setItem(LEGACY, raw)
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    const store = await loadStore()
    store.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: null })

    expect(spy).not.toHaveBeenCalled()
    expect(localStorage.getItem(LEGACY)).toBe(raw)
    expect(store.getState().storageStatus).toBe('legacy-error')
    expect(store.getState().cards['ESP:loc']).toBeDefined()
  })

  it('storage bloqueado no lanza', async () => {
    const desc = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError')
      },
    })
    try {
      const store = await loadStore()
      expect(() => store.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: 800 })).not.toThrow()
      expect(store.getState().cards['ESP:loc']).toBeDefined()
      expect(store.getState().countryProgress.ESP).toBeDefined()
      expect(store.getState().storageStatus).toBe('unavailable')
    } finally {
      Object.defineProperty(window, 'localStorage', desc)
    }
  })

  it('cuota: a setItem that throws once does not throw and halves the log', async () => {
    const seed = {
      ...freshV2(T0),
      reviewLog: Array.from({ length: 99 }, (_, i) => ['ESP:loc', 3, 1000 + i, 1, 5, null]),
    }
    localStorage.setItem(KEY, JSON.stringify({ state: seed, version: 2 }))
    const store = await loadStore()

    const orig = Storage.prototype.setItem
    let thrown = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (k, v) {
      if (k === KEY && thrown === 0) {
        thrown++
        throw new DOMException('full', 'QuotaExceededError')
      }
      return orig.call(this, k, v)
    })

    expect(() => store.getState().answer('FRA:cap', Rating.Good, T0, { latencyMs: 700 })).not.toThrow()
    expect(thrown).toBe(1)
    const log = readV2().state.reviewLog
    expect(log).toHaveLength(50)
    expect(log.at(-1)[0]).toBe('FRA:cap')
  })

  it('JSON corrupto (legacy): copied aside, then a new user that saves normally', async () => {
    localStorage.setItem(LEGACY, '{"state": {broken')
    const store = await loadStore()

    const corrupt = Object.keys(localStorage).filter((k) => k.startsWith('orbita-storage-corrupt-'))
    expect(corrupt).toHaveLength(1)
    expect(localStorage.getItem(corrupt[0])).toBe('{"state": {broken')
    expect(store.getState().storageStatus).toBe('ok')

    store.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: null })
    expect(readV2().state.cards['ESP:loc']).toBeDefined()

    const reloaded = (await loadStore()).getState()
    expect(reloaded.storageStatus).toBe('ok')
    expect(reloaded.cards['ESP:loc']).toBeDefined()
    // The legacy key is never written or removed; no second corrupt copy.
    expect(localStorage.getItem(LEGACY)).toBe('{"state": {broken')
    expect(Object.keys(localStorage).filter((k) => k.startsWith('orbita-storage-corrupt-'))).toHaveLength(1)
  })

  it('JSON corrupto (v2) + valid legacy: copied aside and re-migrated from legacy', async () => {
    const raw = v0Raw({ countryProgress: { ESP: { locationConf: 70, capitalConf: 0, flagConf: 0, timesWrong: 0 } } })
    localStorage.setItem(LEGACY, raw)
    localStorage.setItem(KEY, 'not json')
    const store = await loadStore()

    const corrupt = Object.keys(localStorage).filter((k) => k.startsWith('orbita-v2-corrupt-'))
    expect(corrupt).toHaveLength(1)
    expect(localStorage.getItem(corrupt[0])).toBe('not json')
    expect(store.getState().cards['ESP:loc']).toBeDefined()
    expect(store.getState().storageStatus).toBe('ok')
    expect(localStorage.getItem(BACKUP)).toBe(raw)

    const reloaded = (await loadStore()).getState()
    expect(reloaded.cards['ESP:loc']).toBeDefined()
    expect(readV2().state.cards['ESP:loc']).toBeDefined()
  })

  it('JSON corrupto and the quarantine copy fails: no writes at all', async () => {
    localStorage.setItem(KEY, 'not json')
    localStorage.setItem(LEGACY, v0Raw({ countryProgress: { ESP: { locationConf: 70, timesWrong: 0 } } }))
    const orig = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (k, v) {
      if (k.includes('-corrupt-')) throw new DOMException('full', 'QuotaExceededError')
      return orig.call(this, k, v)
    })
    const store = await loadStore()
    store.getState().answer('FRA:loc', Rating.Good, T0, { latencyMs: null })

    expect(spy.mock.calls.every(([k]) => k.includes('-corrupt-'))).toBe(true)
    expect(localStorage.getItem(KEY)).toBe('not json')
    expect(localStorage.getItem(BACKUP)).toBeNull()
    expect(store.getState().storageStatus).toBe('corrupt')
  })

  it('stored version > 2: no writes and needsReload', async () => {
    const future = JSON.stringify({ state: { schema: 3, cards: {} }, version: 3 })
    localStorage.setItem(KEY, future)
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    const store = await loadStore()
    store.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: null })

    expect(spy).not.toHaveBeenCalled()
    expect(localStorage.getItem(KEY)).toBe(future)
    expect(store.getState().needsReload).toBe(true)
  })

  it('a newer bundle writing version 3 mid-session flips needsReload and stops writes', async () => {
    const store = await loadStore()
    store.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: null })
    const future = JSON.stringify({ state: { schema: 3, cards: {} }, version: 3 })
    localStorage.setItem(KEY, future)

    store.getState().answer('FRA:loc', Rating.Good, T0 + 1000, { latencyMs: null })

    expect(localStorage.getItem(KEY)).toBe(future)
    expect(store.getState().needsReload).toBe(true)
  })

  it('tamaño: 585 cards + 5000 log entries stay under 350 KB', () => {
    const countries = ['AFG', 'ALB']
    const cards = {}
    let t = T0
    for (let i = 0; i < 195; i++) {
      for (const cat of ['loc', 'cap', 'flag']) {
        let c = newCard(t)
        for (const r of [Rating.Good, Rating.Good, Rating.Hard, Rating.Good]) {
          c = reviewCard(c, r, t, { fuzz: false }).card
          t += 86400000 * 3.37
        }
        cards[`${countries[i % 2]}${i}:${cat}`] = c
      }
    }
    expect(Object.keys(cards)).toHaveLength(585)
    const ids = Object.keys(cards)
    const reviewLog = Array.from({ length: 5000 }, (_, i) =>
      toLogEntry(ids[i % 585], [3, Math.floor((T0 + i * 61789) / 1000), 12.345678901234, 5.678901234567], 12345),
    )
    const state = { ...freshV2(T0), cards, reviewLog }
    expect(JSON.stringify({ state, version: 2 }).length).toBeLessThan(350_000)
  })
})
