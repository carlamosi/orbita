import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Minimal mocks: isolate FlagQuiz itself from data loading and heavy components.
vi.mock('../context/WorldDataContext', () => ({
  useWorldData: () => ({ countries: [] }),
}))
vi.mock('../hooks/useCountryGame', () => ({
  useCountryGame: () => ({
    currentCountry: null, score: 0, combo: 0, questionCount: 0, maxQuestions: 10,
    isFinished: false, nextQuestion: () => {}, handleAnswer: () => {}, restartGame: () => {},
  }),
}))
vi.mock('../hooks/useKeyboard', () => ({ useKeyboard: () => {} }))
vi.mock('../components', () => ({
  Confetti: () => null,
  Button: ({ children, ...p }) => <button {...p}>{children}</button>,
}))

import FlagQuiz from './FlagQuiz.jsx'

function mountFlagQuiz() {
  let error = null
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const root = createRoot(document.body.appendChild(document.createElement('div')))
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/flag']}>
          <FlagQuiz />
        </MemoryRouter>
      )
    })
  } catch (e) {
    error = e
  }
  spy.mockRestore()
  return error
}

describe('FlagQuiz mounts (SRS-1 / BUG-01)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('renders without throwing (React hooks must be imported)', () => {
    expect(mountFlagQuiz()?.toString() ?? null).toBeNull()
  })

  it('does not fail with a ReferenceError (/flag page)', () => {
    const error = mountFlagQuiz()
    expect(error?.message ?? '').not.toMatch(/is not defined/)
    expect(error).toBeNull()
  })
})
