import { describe, it, expect, beforeEach, vi } from 'vitest'
import typicalRaw from './__fixtures__/v0-typical.json?raw'
import countries from '../data/countries.json'
import { migrateV0toV2, freshV2 } from './migrate.js'
import { exportProgress, importProgress } from './backup.js'
import { materializeProgress } from './conf.js'
import { Rating, State, reviewCard } from './scheduler.js'

// Realistic round trip: v0 user migrates, plays with the real store, exports,
// then imports the file into an empty browser and into one with newer progress.

const T0 = Date.parse('2026-11-05T10:00:00+01:00')
const MIN = 60000
const validIds = new Set(countries.map((c) => c.id))

async function loadStore() {
  vi.resetModules()
  const mod = await import('../store/useGameStore.js')
  return mod.useGameStore
}

describe('backup round trip (v0 -> store -> export -> import)', () => {
  let state
  beforeEach(async () => {
    localStorage.clear()
    const store = await loadStore()
    const migrated = migrateV0toV2(JSON.parse(typicalRaw), T0, validIds)
    store.getState().importState(migrated)
    const { answer } = store.getState()
    answer('DEU:loc', Rating.Again, T0 + MIN) // New -> Again: learning, wrong = 1
    answer('ITA:cap', Rating.Good, T0 + 2 * MIN) // New -> Good: still learning
    answer('ESP:loc', Rating.Good, T0 + 3 * MIN) // migrated Review card stays Review
    state = store.getState()
  })

  it('the played state has the card kinds this test is about', () => {
    expect(state.cards['DEU:loc'].state).toBe(State.Learning)
    expect(state.cards['DEU:loc'].wrong).toBe(1)
    expect(state.cards['ITA:cap'].state).toBe(State.Learning)
    expect(state.cards['ESP:loc'].state).toBe(State.Review)
  })

  it('(a) into a fresh state: every card kept, wrong preserved, same countryProgress', () => {
    const nowMs = T0 + 10 * MIN
    const out = importProgress(exportProgress(state), freshV2(nowMs), nowMs)

    expect(out.cards).toEqual(state.cards)
    expect(out.cards['DEU:loc'].wrong).toBe(1)
    expect(out.reviewLog).toEqual(state.reviewLog)
    expect(materializeProgress(out.cards, nowMs)).toEqual(materializeProgress(state.cards, nowMs))
    // The store materialized countryProgress at the last answer's time.
    expect(materializeProgress(out.cards, T0 + 3 * MIN)).toEqual(state.countryProgress)
  })

  it('(b) into a state where one card is newer: all cards kept, the newer card wins', () => {
    const nowMs = T0 + 10 * MIN
    const json = exportProgress(state)
    const newer = {
      ...reviewCard(state.cards['ESP:loc'], Rating.Again, T0 + 5 * MIN, { fuzz: false }).card,
      wrong: 7,
    }
    const current = { ...freshV2(T0), cards: { 'ESP:loc': newer } }

    const out = importProgress(json, current, nowMs)

    expect(Object.keys(out.cards).sort()).toEqual(Object.keys(state.cards).sort())
    expect(out.cards['ESP:loc']).toEqual(newer)
    for (const id of Object.keys(state.cards)) {
      if (id !== 'ESP:loc') expect(out.cards[id]).toEqual(state.cards[id])
    }
    expect(out.cards['DEU:loc'].wrong).toBe(1)
    expect(materializeProgress(out.cards, nowMs)).toEqual(
      materializeProgress({ ...state.cards, 'ESP:loc': newer }, nowMs),
    )
  })
})
