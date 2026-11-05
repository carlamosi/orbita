import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import countries from '../data/countries.json'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Local replacement for the browser E2E: play 5 questions in /flag against the real
// store and check what lands in localStorage 'orbita-v2'.
vi.mock('../context/WorldDataContext', () => ({
  useWorldData: () => ({ countries, geoData: null, isLoading: false }),
}))
vi.mock('../hooks/useSounds', () => ({
  useSounds: () => ({
    playCorrect: () => {}, playWrong: () => {}, playStreak: () => {}, playComplete: () => {},
  }),
}))
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const strip = ({ initial, animate, exit, transition, layout, ...rest }) => rest
  const motion = new Proxy({}, {
    get: (_, tag) => React.forwardRef((props, ref) => React.createElement(tag, { ...strip(props), ref })),
  })
  return { motion, AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children) }
})

import { useGameStore } from '../store/useGameStore'
import FlagQuiz from './FlagQuiz.jsx'

const initial = useGameStore.getState()

describe('FlagQuiz plays an FSRS session and persists it', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    useGameStore.setState({ ...initial, cards: {}, reviewLog: [], daily: {}, confusions: {} })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T12:00:00+01:00'))
  })
  afterEach(() => { vi.useRealTimers() })

  it('5 answers -> orbita-v2 holds 5 flag cards and today has 5 reviews', () => {
    const root = createRoot(document.body.appendChild(document.createElement('div')))
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/flag']}>
          <FlagQuiz />
        </MemoryRouter>
      )
    })
    expect(document.body.textContent).toMatch(/1 \/ 10/) // fresh user: 10 new cards today

    for (let i = 0; i < 5; i++) {
      const option = document.querySelector('button[aria-label^="Option 1:"]')
      expect(option).not.toBeNull()
      act(() => { option.click() })
      act(() => { vi.advanceTimersByTime(2000) })
    }

    const stored = JSON.parse(localStorage.getItem('orbita-v2')).state
    const flagCards = Object.keys(stored.cards).filter((id) => id.endsWith(':flag'))
    expect(flagCards).toHaveLength(5)
    expect(Object.keys(stored.cards)).toHaveLength(5)
    expect(stored.daily['2026-11-05']).toEqual({ reviews: 5, new: 5 })
    act(() => root.unmount())
  })
})
