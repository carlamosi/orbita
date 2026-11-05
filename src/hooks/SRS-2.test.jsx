import { describe, it, expect, beforeEach, vi } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { State } from '../srs/scheduler.js'

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

const DAY = 86400000

describe('SRS-2: question selection should prioritise weak countries', () => {
  beforeEach(() => {
    localStorage.clear()
    const now = Date.now()
    useGameStore.setState({
      cards: {
        // Failed 3 times, overdue Review card.
        'TCD:loc': {
          due: now - DAY, stability: 1, difficulty: 8, scheduled_days: 1, learning_steps: 0,
          reps: 6, lapses: 3, state: State.Review, last_review: now - 2 * DAY, wrong: 3,
        },
        // Mastered, next review months away.
        'FRA:loc': {
          due: now + 100 * DAY, stability: 200, difficulty: 2, scheduled_days: 120, learning_steps: 0,
          reps: 10, lapses: 0, state: State.Review, last_review: now - 20 * DAY, wrong: 0,
        },
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
    // With SRS, an overdue card failed 3x comes before a mastered one.
    // Uniform Math.random() gives ~50%.
    expect(ratio).toBeGreaterThan(0.7)
  })
})
