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

const readV2 = () => JSON.parse(localStorage.getItem('orbita-v2')).state

describe('SRS-4: wrong answer must not penalize the clicked (unasked) country', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ cards: {}, confusions: {}, reviewLog: [], daily: {} })
  })

  it('asked Chad, clicked Niger: only Chad is rated, Niger is recorded as a confusion', () => {
    const { result } = renderHook(() => useCountryGame('find'))
    expect(result.current.currentCountry?.id).toBe('TCD')

    act(() => { result.current.handleAnswer(false, 'NER') })

    const s = useGameStore.getState()
    // Asked country is rated (Again)
    expect(s.cards['TCD:loc'].wrong).toBe(1)
    expect(s.reviewLog.map((e) => e[0])).toEqual(['TCD:loc'])
    // Unasked, clicked country is never rated
    expect(s.cards['NER:loc']).toBeUndefined()
    expect(s.confusions['TCD:loc']).toEqual({ NER: 1 })

    expect(readV2().cards['NER:loc']).toBeUndefined()
    expect(readV2().confusions['TCD:loc']).toEqual({ NER: 1 })
  })

  it('clicking a polygon id not in the dataset must not create a card or a confusion', () => {
    const { result } = renderHook(() => useCountryGame('find'))
    act(() => { result.current.handleAnswer(false, '-99') })
    const s = useGameStore.getState()
    expect(s.cards['-99:loc']).toBeUndefined()
    expect(s.confusions['TCD:loc']).toBeUndefined()
    expect(s.cards['TCD:loc'].wrong).toBe(1)
  })
})
