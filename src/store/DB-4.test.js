import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Rating } from '../srs/scheduler.js'

// DB-4 (audit): after a deploy, a tab still running the old bundle keeps writing
// v0 data to 'orbita-storage'. v2 lives in 'orbita-v2', so it is never overwritten,
// and what the old tab writes is merged in without dropping any v2 card.
async function loadStore() {
  vi.resetModules()
  const mod = await import('./useGameStore.js')
  return mod.useGameStore
}

const T0 = Date.parse('2026-11-05T10:00:00+01:00')
const readV2 = () => JSON.parse(localStorage.getItem('orbita-v2'))

function oldBundleWrite(countryProgress) {
  const raw = JSON.stringify({
    state: {
      streak: 1,
      lastSession: '2026-11-05',
      totalSessions: 1,
      countryProgress,
      activityLog: [],
      dailyActivity: { '2026-11-05': 1 },
      speedRoundBests: [],
      flagSessionsCompleted: 0,
      challenges: { perfectContinents: {} },
    },
    version: 0,
  })
  localStorage.setItem('orbita-storage', raw)
  return raw
}

describe('DB-4: escritura legacy posterior se fusiona sin borrar cards', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('an old-bundle write after migration is merged; v2 cards and log survive', async () => {
    const store = await loadStore()
    store.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: 900 })
    const before = readV2()

    // Old tab writes stale ESP data plus a new country.
    const raw = oldBundleWrite({
      ESP: { locationConf: 10, capitalConf: 0, flagConf: 0, timesWrong: 4 },
      FRA: { locationConf: 0, capitalConf: 70, flagConf: 0, timesWrong: 0 },
    })
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'orbita-storage', newValue: raw, storageArea: localStorage }),
    )

    const after = readV2()
    expect(after.version).toBe(2)
    expect(after.state.cards['ESP:loc']).toEqual(before.state.cards['ESP:loc'])
    expect(after.state.reviewLog).toEqual(before.state.reviewLog)
    expect(after.state.cards['FRA:cap']).toBeDefined()
    expect(store.getState().countryProgress.FRA.capitalConf).toBeGreaterThanOrEqual(70)
    // The legacy key is never rewritten by the new bundle.
    expect(localStorage.getItem('orbita-storage')).toBe(raw)
  })

  it('an old-bundle write while no v2 tab was open is merged on the next load', async () => {
    const store = await loadStore()
    store.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: 900 })
    const espCard = store.getState().cards['ESP:loc']

    oldBundleWrite({ ITA: { locationConf: 0, capitalConf: 0, flagConf: 65, timesWrong: 0 } })
    const reloaded = (await loadStore()).getState()

    expect(reloaded.cards['ESP:loc']).toEqual(espCard)
    expect(reloaded.cards['ITA:flag']).toBeDefined()
    expect(readV2().state.cards['ITA:flag']).toBeDefined()

    // Same legacy content again: nothing new to absorb, the card is not reseeded.
    const ita = readV2().state.cards['ITA:flag']
    await loadStore()
    expect(readV2().state.cards['ITA:flag']).toEqual(ita)
  })
})
