import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { Rating } from '../srs/scheduler.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const COUNTRIES = [
  { id: 'ESP', name: 'Spain' },
  { id: 'FRA', name: 'France' },
  { id: 'ITA', name: 'Italy' },
]
const GEO = { features: [{ id: 'ESP' }, { id: 'FRA' }, { id: 'ITA' }] }

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

const T0 = Date.parse('2026-11-05T10:00:00+01:00')
const lastLog = () => useGameStore.getState().reviewLog.at(-1)

function setHidden(hidden) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useCountryGame with FSRS sessions', () => {
  let clock
  const now = () => clock
  beforeEach(() => {
    localStorage.clear()
    clock = T0
    setHidden(false)
    useGameStore.setState({ cards: {}, reviewLog: [], daily: {}, confusions: {} })
  })

  it('builds the session from the pool: maxQuestions = session length, card id uses the mode category', () => {
    const { result, unmount } = renderHook(() => useCountryGame('flag', { now }))
    expect(result.current.maxQuestions).toBe(3)
    expect(result.current.questionCount).toBe(1)
    const asked = result.current.currentCountry.id
    clock += 1000
    act(() => { result.current.handleAnswer(true, null, { inputKind: 'choice' }) })
    expect(lastLog()[0]).toBe(`${asked}:flag`)
    expect(lastLog()[1]).toBe(Rating.Good)
    expect(lastLog()[5]).toBe(1000) // latency since the question was shown
    unmount()
  })

  it('uses the pool option and ignores countries outside it', () => {
    const pool = [COUNTRIES[1]]
    const { result, unmount } = renderHook(() => useCountryGame('flag', { pool, now }))
    expect(result.current.maxQuestions).toBe(1)
    expect(result.current.currentCountry.id).toBe('FRA')
    unmount()
  })

  it('hintUsed rates Hard; a slow answer rates Hard; wrong rates Again', () => {
    const { result, unmount } = renderHook(() => useCountryGame('find', { now }))
    clock += 500
    act(() => { result.current.handleAnswer(true, null, { hintUsed: true }) })
    expect(lastLog()[1]).toBe(Rating.Hard)
    act(() => { result.current.nextQuestion() })
    clock += 60000
    act(() => { result.current.handleAnswer(true) })
    expect(lastLog()[1]).toBe(Rating.Hard)
    act(() => { result.current.nextQuestion() })
    act(() => { result.current.handleAnswer(false) })
    expect(lastLog()[1]).toBe(Rating.Again)
    unmount()
  })

  it('latency is null when the tab was hidden during the question', () => {
    const { result, unmount } = renderHook(() => useCountryGame('find', { now }))
    act(() => { setHidden(true) })
    clock += 120000
    act(() => { setHidden(false) })
    act(() => { result.current.handleAnswer(true) })
    expect(lastLog()[5]).toBeNull()
    expect(lastLog()[1]).toBe(Rating.Good)
    unmount()
  })

  it('a second answer to the same question is ignored', () => {
    const { result, unmount } = renderHook(() => useCountryGame('find', { now }))
    act(() => { result.current.handleAnswer(false) })
    act(() => { result.current.handleAnswer(true) })
    expect(useGameStore.getState().reviewLog).toHaveLength(1)
    unmount()
  })

  it('wrong answer naming the asked country itself records no confusion', () => {
    const { result, unmount } = renderHook(() => useCountryGame('find', { now }))
    const asked = result.current.currentCountry.id
    act(() => { result.current.handleAnswer(false, asked) })
    expect(useGameStore.getState().confusions).toEqual({})
    unmount()
  })

  describe('empty session (nothing due, no new quota)', () => {
    const settings = useGameStore.getState().settings
    beforeEach(() => {
      useGameStore.setState({ cards: {}, settings: { ...settings, dailyNew: 0 } })
    })
    afterEach(() => {
      useGameStore.setState({ settings })
    })

    it('reports sessionEmpty and offers free practice that still records answers', () => {
      const pool = [COUNTRIES[0], COUNTRIES[1]] // no cards yet and no new quota
      const { result, unmount } = renderHook(() => useCountryGame('find', { pool, now }))
      expect(result.current.sessionEmpty).toBe(true)
      expect(result.current.currentCountry).toBeNull()
      expect(result.current.isFinished).toBe(false)

      act(() => { result.current.startPractice() })
      expect(result.current.sessionEmpty).toBe(false)
      expect(result.current.isPractice).toBe(true)
      expect(result.current.maxQuestions).toBeGreaterThan(0)
      const asked = result.current.currentCountry.id
      expect(['ESP', 'FRA']).toContain(asked)
      act(() => { result.current.handleAnswer(true) })
      expect(useGameStore.getState().cards[`${asked}:loc`]).toBeDefined()
      unmount()
    })
  })
})
