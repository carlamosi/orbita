import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Minimal renderHook (@testing-library/dom is not installed in this worktree)
function renderHook(cb) {
  const result = { current: null }
  function Probe() { result.current = cb(); return null }
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => { root.render(createElement(Probe)) })
  return { result }
}

const countries = [
  { id: 'TCD', name: 'Chad' },
]
const geoData = {
  features: [{ id: 'TCD', properties: {} }, { id: 'NER', properties: {} }],
}

vi.mock('../context/WorldDataContext', () => ({
  useWorldData: () => ({ countries, geoData }),
}))
vi.mock('../hooks/useSounds', () => ({
  useSounds: () => ({
    playCorrect: () => {}, playWrong: () => {}, playStreak: () => {}, playComplete: () => {},
  }),
}))

import { useGameStore } from '../store/useGameStore'
import { useCountryGame } from '../hooks/useCountryGame'

describe('SRS-4: wrong answer must not penalize the clicked (unasked) country', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ countryProgress: {} })
  })

  it('asked Chad, clicked Niger: only Chad is penalized', () => {
    const { result } = renderHook(() => useCountryGame('find'))
    expect(result.current.currentCountry?.id).toBe('TCD')

    act(() => { result.current.handleAnswer(false, 'NER') })

    const progress = useGameStore.getState().countryProgress
    // Asked country is penalized (expected)
    expect(progress.TCD.timesWrong).toBe(1)
    // Unasked, clicked country must remain untouched
    expect(progress.NER).toBeUndefined()

    const stored = JSON.parse(localStorage.getItem('orbita-storage'))
    expect(stored.state.countryProgress.NER).toBeUndefined()
  })

  it('clicking a polygon id not in the dataset must not create a progress entry', () => {
    const { result } = renderHook(() => useCountryGame('find'))
    act(() => { result.current.handleAnswer(false, '-99') })
    expect(useGameStore.getState().countryProgress['-99']).toBeUndefined()
  })
})
