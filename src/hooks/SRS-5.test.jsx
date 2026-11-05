import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const COUNTRIES = [
  { id: 'ESP', name: 'Spain', capital: 'Madrid', flagCode: 'es', continent: 'Europe' },
  { id: 'FRA', name: 'France', capital: 'Paris', flagCode: 'fr', continent: 'Europe' },
  { id: 'ITA', name: 'Italy', capital: 'Rome', flagCode: 'it', continent: 'Europe' },
  { id: 'PRT', name: 'Portugal', capital: 'Lisbon', flagCode: 'pt', continent: 'Europe' },
]

vi.mock('../context/WorldDataContext', () => ({
  useWorldData: () => ({ countries: COUNTRIES }),
}))
vi.mock('../hooks/useSounds', () => ({
  useSounds: () => ({ playCorrect: () => {}, playWrong: () => {}, playComplete: () => {} }),
}))
vi.mock('../hooks/useKeyboard', () => ({ useKeyboard: () => {} }))
vi.mock('../components/Button', () => ({
  default: ({ children, variant, ...p }) => <button {...p}>{children}</button>,
}))
// Timer replaced by a button that fires onComplete (simulates the 60 s elapsing)
vi.mock('../components/CircleTimer', () => ({
  default: ({ onComplete }) => <button data-testid="timeup" onClick={() => onComplete?.()}>timeup</button>,
}))

import { useGameStore } from '../store/useGameStore'
import { Rating } from '../srs/scheduler.js'
import SpeedRound from '../pages/SpeedRound.jsx'

const initial = useGameStore.getState()

describe('SRS-5: Speed Round must record answers in progress, session log and streak', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    useGameStore.setState({
      ...initial,
      cards: {}, reviewLog: [], daily: {}, confusions: {}, speedRoundBests: [],
      stats: { ...initial.stats, streak: 0, lastSessionDay: null, totalSessions: 0 },
      countryProgress: {}, dailyActivity: {}, streak: 0, totalSessions: 0,
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T12:00:00+01:00'))
    // Deterministic: sort comparator returns 0 -> target = COUNTRIES[0]; type index 2 = capital_to_name
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('15 correct answers + time up update countryProgress, dailyActivity, streak, totalSessions', () => {
    const root = createRoot(document.body.appendChild(document.createElement('div')))
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/speed']}>
          <SpeedRound />
        </MemoryRouter>
      )
    })
    const start = [...document.querySelectorAll('button')].find(b => b.textContent.includes('START TIMER'))
    act(() => { start.click() })

    expect(document.body.textContent).toContain('Which country has the capital:')
    for (let i = 0; i < 15; i++) {
      const correct = [...document.querySelectorAll('button')].find(b => b.textContent.startsWith('Spain'))
      act(() => { correct.click() })
      act(() => { vi.advanceTimersByTime(60) })
    }
    act(() => { document.querySelector('[data-testid="timeup"]').click() })

    const s = useGameStore.getState()
    // Sanity: the game actually ran and was scored
    expect(s.speedRoundBests[0]?.score).toBe(150)
    expect(s.speedRoundBests[0]?.fraction).toBe('15/15')

    // Every answer is rated (timed => Good) on the card the question tests
    // (capital_to_name -> cap), and the session counts for streak and activity.
    expect.soft(s.cards['ESP:cap'], 'card for answered country').toBeDefined()
    expect.soft(s.reviewLog.length, 'reviewLog entries').toBe(15)
    expect.soft(s.reviewLog.every((e) => e[0] === 'ESP:cap' && e[1] === Rating.Good), 'timed ratings').toBe(true)
    expect.soft(s.countryProgress.ESP, 'countryProgress for answered country').toBeDefined()
    expect.soft(Object.keys(s.dailyActivity).length, 'dailyActivity entries').toBeGreaterThan(0)
    expect.soft(s.totalSessions, 'totalSessions').toBeGreaterThan(0)
    expect.soft(s.streak, 'streak').toBeGreaterThan(0)
    const stored = JSON.parse(localStorage.getItem('orbita-v2')).state
    expect.soft(stored.cards['ESP:cap'], 'persisted card').toBeDefined()
    expect.soft(stored.stats.totalSessions, 'persisted totalSessions').toBe(1)
    act(() => root.unmount())
  })
})
