import { describe, it, expect, beforeEach, vi } from 'vitest'

// Simulates two browser tabs: two independent module instances of the store
// (vi.resetModules) sharing the same localStorage, as real tabs of one origin do.
async function openTab() {
  vi.resetModules()
  const mod = await import('../store/useGameStore.js')
  return mod.useGameStore
}

function readStored() {
  return JSON.parse(localStorage.getItem('orbita-storage')).state
}

describe('DB-1: two tabs must not wipe each other progress', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('progress saved in tab A survives a later write from tab B', async () => {
    const tabA = await openTab()
    const tabB = await openTab()

    // Tab A: correct answer on ESP + session bookkeeping
    tabA.getState().actions.updateProgress('ESP', 'locationConf', 15)
    tabA.getState().actions.incrementStreak()
    tabA.getState().actions.logSession('find', 10)

    const oldValue = null
    const afterA = localStorage.getItem('orbita-storage')
    expect(readStored().countryProgress.ESP.locationConf).toBe(15)

    // A real browser notifies other tabs with a 'storage' event; deliver it to tab B
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'orbita-storage',
        oldValue,
        newValue: afterA,
        storageArea: localStorage,
      })
    )

    // Tab B (never reloaded): answers any question
    tabB.getState().actions.updateProgress('FRA', 'capitalConf', 15)

    // Reload tab A: fresh instance reading localStorage
    const reloadedA = await openTab()
    const state = reloadedA.getState()

    expect(readStored().countryProgress.FRA.capitalConf).toBe(15)
    // Expected correct behaviour: A's progress is still there
    expect(state.countryProgress.ESP?.locationConf).toBe(15)
    expect(state.totalSessions).toBe(1)
    expect(Object.values(state.dailyActivity).reduce((a, b) => a + b, 0)).toBe(1)
  })
})
