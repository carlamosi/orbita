import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import countries from '../data/countries.json'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const pools = []
vi.mock('../hooks/useCountryGame', () => ({
  useCountryGame: (_mode, { pool }) => {
    pools.push(pool)
    return { currentCountry: pool[0], score: 0, combo: 0, questionCount: 1, maxQuestions: 10, isFinished: false, sessionEmpty: false, nextQuestion() {}, handleAnswer() {}, restartGame() {}, startPractice() {} }
  },
}))
vi.mock('../context/WorldDataContext', () => ({
  useWorldData: () => ({ countries, geoData: null, isLoading: false }),
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
const similarIds = new Set(countries.flatMap((c) => (c.similarTo ? [c.id, c.similarTo] : [])))

function mount() {
  const root = createRoot(document.body.appendChild(document.createElement('div')))
  act(() => { root.render(<MemoryRouter><FlagQuiz /></MemoryRouter>) })
  return root
}
const toggle = () => act(() => { [...document.querySelectorAll('label')].find((l) => /Similar Flags/.test(l.textContent)).click() })

describe('FlagQuiz similar flags toggle', () => {
  beforeEach(() => {
    pools.length = 0
    document.body.innerHTML = ''
    useGameStore.setState({ ...initial, confusions: {} })
  })

  it('pool only holds similar countries once the toggle is on', () => {
    mount()
    expect(pools.at(-1)).toHaveLength(countries.length)
    toggle()
    const pool = pools.at(-1)
    expect(pool.length).toBeGreaterThanOrEqual(4)
    expect(pool.length).toBeLessThan(countries.length)
    expect(pool.every((c) => similarIds.has(c.id))).toBe(true)
    // the target of a similarTo (not itself flagged) is included
    const target = countries.find((c) => c.similarTo).similarTo
    expect(pool.some((c) => c.id === target)).toBe(true)
  })

  it('confusions on flag cards widen the pool', () => {
    const extra = countries.find((c) => !similarIds.has(c.id))
    useGameStore.setState({ confusions: { [`${extra.id}:flag`]: { ESP: 2 } } })
    mount()
    toggle()
    expect(pools.at(-1).some((c) => c.id === extra.id)).toBe(true)
  })
})
