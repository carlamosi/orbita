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
vi.mock('../components/CircleTimer', () => ({
  default: ({ onComplete }) => <button data-testid="timeup" onClick={() => onComplete?.()}>timeup</button>,
}))

import { useGameStore } from '../store/useGameStore'
import SpeedRound from './SpeedRound.jsx'

const initial = useGameStore.getState()

function play(correctAnswers) {
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
  for (let i = 0; i < correctAnswers; i++) {
    // Math.random = 0.5: target Spain, type capital_to_name
    const correct = [...document.querySelectorAll('button')].find(b => b.textContent.startsWith('Spain'))
    act(() => { correct.click() })
    act(() => { vi.advanceTimersByTime(60) })
  }
  act(() => { document.querySelector('[data-testid="timeup"]').click() })
  return root
}

describe('SpeedRound end screen (BUG-13)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    useGameStore.setState({ ...initial, cards: {}, reviewLog: [], daily: {}, speedRoundBests: [] })
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('shows "New Record" when the score beats the previous best', () => {
    useGameStore.setState({
      speedRoundBests: [{ score: 50, fraction: '5/5', qpm: 5, date: '2026-11-01T10:00:00.000Z', continent: 'all' }],
    })
    const root = play(15)
    expect(useGameStore.getState().speedRoundBests[0].score).toBe(150)
    expect(document.body.textContent).toContain('New Record')
    act(() => root.unmount())
  })

  it('does not show "New Record" when the score does not beat the previous best', () => {
    useGameStore.setState({
      speedRoundBests: [{ score: 500, fraction: '50/50', qpm: 50, date: '2026-11-01T10:00:00.000Z', continent: 'all' }],
    })
    const root = play(3)
    expect(document.body.textContent).not.toContain('New Record')
    act(() => root.unmount())
  })
})
