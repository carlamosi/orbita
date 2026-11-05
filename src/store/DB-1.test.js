import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Rating } from '../srs/scheduler.js'

// DB-1 (audit): two open tabs must not wipe each other's progress.
// Two independent module instances of the store (vi.resetModules) share one
// localStorage, as real tabs of one origin do.
async function openTab() {
  vi.resetModules()
  const mod = await import('./useGameStore.js')
  return mod.useGameStore
}

const T0 = Date.parse('2026-11-05T10:00:00+01:00')
const readV2 = () => JSON.parse(localStorage.getItem('orbita-v2')).state

describe('DB-1: two tabs keep both answers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('a write from a tab that never saw the other tab keeps both answers on disk', async () => {
    const tabA = await openTab()
    const tabB = await openTab()

    tabA.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: 900 })
    tabA.getState().finishSession('find', 10, T0)
    // No storage event delivered: tab B's memory knows nothing about tab A.
    tabB.getState().answer('FRA:cap', Rating.Good, T0 + 5000, { latencyMs: 1100 })

    const disk = readV2()
    expect(Object.keys(disk.cards).sort()).toEqual(['ESP:loc', 'FRA:cap'])
    expect(disk.reviewLog.map((e) => e[0])).toEqual(['ESP:loc', 'FRA:cap'])
    expect(disk.stats.totalSessions).toBe(1)
    // daily merges by max (spec): concurrent tabs undercount activity, never lose cards.
    expect(disk.daily['2026-11-05'].reviews).toBe(1)

    const reloaded = (await openTab()).getState()
    expect(reloaded.countryProgress.ESP).toBeDefined()
    expect(reloaded.countryProgress.FRA).toBeDefined()
    expect(reloaded.totalSessions).toBe(1)
  })

  it('the storage event brings tab A progress into tab B memory', async () => {
    const tabA = await openTab()
    const tabB = await openTab()

    tabA.getState().answer('ESP:loc', Rating.Good, T0, { latencyMs: 900 })
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'orbita-v2',
        newValue: localStorage.getItem('orbita-v2'),
        storageArea: localStorage,
      }),
    )
    expect(tabB.getState().cards['ESP:loc']).toBeDefined()
    expect(tabB.getState().countryProgress.ESP).toBeDefined()

    tabB.getState().answer('FRA:cap', Rating.Good, T0 + 5000, { latencyMs: 1100 })
    expect(Object.keys(readV2().cards).sort()).toEqual(['ESP:loc', 'FRA:cap'])
  })
})
