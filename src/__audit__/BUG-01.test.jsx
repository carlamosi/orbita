import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
globalThis.IS_REACT_ACT_ENVIRONMENT = true
import { MemoryRouter } from 'react-router-dom'

const countries = [
  { id: 'ESP', name: 'Spain', capital: 'Madrid', flag: 'es', region: 'Europe' },
  { id: 'FRA', name: 'France', capital: 'Paris', flag: 'fr', region: 'Europe' },
  { id: 'ITA', name: 'Italy', capital: 'Rome', flag: 'it', region: 'Europe' },
  { id: 'DEU', name: 'Germany', capital: 'Berlin', flag: 'de', region: 'Europe' },
]

vi.mock('../context/WorldDataContext', () => ({
  useWorldData: () => ({ countries, geoData: null, isLoading: false }),
  WorldDataProvider: ({ children }) => children,
}))

import FlagQuiz from '../pages/FlagQuiz'

describe('BUG-01: FlagQuiz renders without ReferenceError', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mounts the /flag page without throwing (React hooks must be defined)', () => {
    let error = null
    try {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const root = createRoot(container)
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
    expect(error?.message ?? '').not.toMatch(/is not defined/)
    expect(error).toBeNull()
  })
})
