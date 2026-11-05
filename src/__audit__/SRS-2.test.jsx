import { describe, it, expect, beforeEach, vi } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const COUNTRIES = [
  { id: 'TCD', name: 'Chad' },
  { id: 'FRA', name: 'France' },
]
const GEO = { features: [{ id: 'TCD' }, { id: 'FRA' }] }

vi.mock('../context/WorldDataContext', () => ({
  useWorldData: () => ({ countries: COUNTRIES, geoData: GEO }),
}))
vi.mock('../hooks/useSounds', () => ({
  useSounds: () => ({
    playCorrect: () => {}, playWrong: () => {}, playStreak: () => {}, playComplete: () => {},
  }),
}))

import { useGameStore } from '../store/useGameStore'
import { useCountryGame } from '../hooks/useCountryGame'

// Minimal renderHook replacement (@testing-library/dom is not installed).
function renderHookOnce(cb) {
  const result = { current: null }
  function Probe() { result.current = cb(); return null }
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => { root.render(React.createElement(Probe)) })
  return { result, unmount: () => act(() => root.unmount()) }
}

describe('SRS-2: question selection should prioritise weak countries', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({
      countryProgress: {
        TCD: { locationConf: 0, capitalConf: 0, flagConf: 0, timesWrong: 3 },       // failed 3 times
        FRA: { locationConf: 100, capitalConf: 100, flagConf: 100, timesWrong: 0 }, // mastered
      },
    })
  })

  it('picks the weak country (Chad) clearly more often than the mastered one (France)', () => {
    const N = 400
    let chad = 0, picked = 0
    for (let i = 0; i < N; i++) {
      const { result, unmount } = renderHookOnce(() => useCountryGame('find'))
      const id = result.current.currentCountry?.id
      if (id) picked++
      if (id === 'TCD') chad++
      unmount()
    }
    expect(picked).toBe(N) // sanity: the hook really produced a question each time
    const ratio = chad / N
    console.log(`Chad picked ${chad}/${N} = ${(ratio * 100).toFixed(1)}%`)
    // With SRS / weak-point weighting, a country failed 3x with 0 confidence must
    // dominate over a 100%-mastered one. Uniform Math.random() gives ~50%.
    expect(ratio).toBeGreaterThan(0.7)
  })
})
