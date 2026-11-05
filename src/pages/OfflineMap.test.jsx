import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import countries from '../data/countries.json'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const world = { value: {} }
vi.mock('../context/WorldDataContext', async (orig) => ({
  ...(await orig()),
  useWorldData: () => world.value,
}))
vi.mock('../hooks/useSounds', () => ({
  useSounds: () => ({ playCorrect: () => {}, playWrong: () => {}, playStreak: () => {}, playComplete: () => {} }),
}))
vi.mock('../components', () => ({
  Globe3D: () => <div data-testid="globe" />,
  QuestionCard: () => <div data-testid="qcard" />,
  Confetti: () => null,
  Button: ({ children, variant, size, ...p }) => <button {...p}>{children}</button>,
  AnswerInput: () => <div data-testid="answer-input" />,
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
import FindCountry from './FindCountry.jsx'
import CapitalQuiz from './CapitalQuiz.jsx'
import FlagQuiz from './FlagQuiz.jsx'

const MESSAGE = 'Map unavailable offline'

function render(el) {
  document.body.replaceChildren()
  const root = createRoot(document.body.appendChild(document.createElement('div')))
  act(() => { root.render(<MemoryRouter>{el}</MemoryRouter>) })
}

beforeEach(() => {
  localStorage.clear()
  world.value = { countries, geoData: null, geoError: new Error('offline'), isLoading: false, shapeIds: new Set() }
})
afterEach(() => vi.restoreAllMocks())

describe('offline map', () => {
  it('FindCountry shows the message and answers nothing', () => {
    const answer = vi.fn()
    const spy = vi.spyOn(useGameStore, 'getState')
    useGameStore.setState({ answer })
    render(<FindCountry />)
    expect(document.body.textContent).toContain(MESSAGE)
    expect(document.querySelector('a[href="/flag"]')).not.toBeNull()
    expect(answer).not.toHaveBeenCalled()
    expect(document.querySelector('[data-testid="globe"]')).toBeNull()
    spy.mockRestore()
  })

  it('CapitalQuiz locate tab shows the message, text tabs still play', () => {
    render(<CapitalQuiz />)
    expect(document.body.textContent).not.toContain(MESSAGE)
    expect(document.querySelector('[data-testid="answer-input"]')).not.toBeNull()
    const locate = [...document.querySelectorAll('button')].find(b => b.textContent.includes('On Globe'))
    act(() => { locate.click() })
    expect(document.body.textContent).toContain(MESSAGE)
    expect(document.querySelector('[data-testid="globe"]')).toBeNull()
  })
})

describe('FlagQuiz with blocked storage', () => {
  it('renders when localStorage getter throws', () => {
    world.value = { countries, geoData: null, isLoading: false }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
    expect(() => render(<FlagQuiz />)).not.toThrow()
    expect(document.body.textContent.length).toBeGreaterThan(0)
  })
})
