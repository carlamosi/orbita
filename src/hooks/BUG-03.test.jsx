import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const COUNTRIES = [
  { id: 'ESP', name: 'Spain' },
  { id: 'FRA', name: 'France' },
]
const GEO = { features: [{ id: 'ESP' }, { id: 'FRA' }] }

vi.mock('../context/WorldDataContext', () => ({
  useWorldData: () => ({ countries: COUNTRIES, geoData: GEO }),
}))
vi.mock('./useSounds', () => ({
  useSounds: () => ({
    playCorrect: () => {}, playWrong: () => {}, playStreak: () => {}, playComplete: () => {},
  }),
}))

import { useGameStore } from '../store/useGameStore'
import { useCountryGame } from './useCountryGame'

function renderHook(cb) {
  const result = { current: null }
  function Probe() { result.current = cb(); return null }
  const root = createRoot(document.createElement('div'))
  act(() => { root.render(createElement(Probe)) })
  return { result, unmount: () => act(() => root.unmount()) }
}

describe('BUG-03: finishSession receives the final score, including the last answer', () => {
  let finishSpy
  beforeEach(() => {
    localStorage.clear()
    finishSpy = vi.fn()
    useGameStore.setState({ cards: {}, reviewLog: [], daily: {}, confusions: {}, finishSession: finishSpy })
  })

  it('answers every question like the pages do (nextQuestion captured before the answer)', () => {
    const { result, unmount } = renderHook(() => useCountryGame('find'))
    for (let i = 0; i < 50 && !result.current.isFinished; i++) {
      // Pages call nextQuestion from a setTimeout closure created at click time.
      const { handleAnswer, nextQuestion } = result.current
      act(() => { handleAnswer(true) })
      act(() => { nextQuestion() })
    }
    expect(result.current.isFinished).toBe(true)
    const finalScore = result.current.score
    expect(finalScore).toBeGreaterThan(0)
    expect(finishSpy).toHaveBeenCalledTimes(1)
    expect(finishSpy.mock.calls[0][0]).toBe('find')
    expect(finishSpy.mock.calls[0][1]).toBe(finalScore)
    unmount()
  })
})
