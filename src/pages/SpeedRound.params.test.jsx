import { describe, it, expect, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const COUNTRIES = [
  { id: 'ESP', name: 'Spain', capital: 'Madrid', flagCode: 'es', continent: 'Europe' },
  { id: 'FRA', name: 'France', capital: 'Paris', flagCode: 'fr', continent: 'Europe' },
  { id: 'ITA', name: 'Italy', capital: 'Rome', flagCode: 'it', continent: 'Europe' },
  { id: 'PRT', name: 'Portugal', capital: 'Lisbon', flagCode: 'pt', continent: 'Europe' },
  { id: 'JPN', name: 'Japan', capital: 'Tokyo', flagCode: 'jp', continent: 'Asia' },
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
vi.mock('../components/CircleTimer', () => ({ default: () => null }))

import SpeedRound from './SpeedRound.jsx'

function run(url) {
  document.body.innerHTML = ''
  const root = createRoot(document.body.appendChild(document.createElement('div')))
  act(() => {
    root.render(<MemoryRouter initialEntries={[url]}><SpeedRound /></MemoryRouter>)
  })
  const text = document.body.textContent
  const start = [...document.querySelectorAll('button')].find(b => b.textContent.includes('START TIMER'))
  act(() => { start.click() })
  return text
}

describe('SpeedRound continent param', () => {
  it('unknown continent falls back to all and plays', () => {
    const startText = run('/speed?continent=Atlantis')
    expect(startText).not.toContain('Atlantis')
    expect(document.querySelectorAll('button').length).toBeGreaterThanOrEqual(4)
  })

  it('a continent with fewer than 4 countries falls back to all', () => {
    const startText = run('/speed?continent=Asia')
    expect(startText).not.toContain('Asia Edition')
    expect(document.querySelectorAll('button').length).toBeGreaterThanOrEqual(4)
  })

  it('a valid continent with 4 or more countries is kept', () => {
    expect(run('/speed?continent=Europe')).toContain('Europe Edition')
  })
})
