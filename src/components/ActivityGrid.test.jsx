import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useGameStore } from '../store/useGameStore'
import ActivityGrid from './ActivityGrid.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
const initial = useGameStore.getState()

describe('ActivityGrid uses local days', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    useGameStore.setState({ ...initial, cards: {}, reviewLog: [], daily: {}, confusions: {}, dailyActivity: {} })
    vi.useFakeTimers()
  })
  afterEach(() => { vi.useRealTimers() })

  it('an answer at 00:30 Madrid lands on the new local day cell', () => {
    vi.setSystemTime(new Date('2026-11-06T00:30:00+01:00'))
    act(() => { useGameStore.getState().answer('ESP:loc', 3, Date.now()) })
    const root = createRoot(document.body.appendChild(document.createElement('div')))
    act(() => { root.render(<ActivityGrid />) })
    const cells = document.querySelectorAll('[data-day]')
    expect(cells).toHaveLength(364)
    const last = cells[cells.length - 1]
    expect(last.getAttribute('data-day')).toBe('2026-11-06')
    expect(last.getAttribute('data-count')).toBe('1')
    expect(document.querySelector('[data-day="2026-11-05"]').getAttribute('data-count')).toBe('0')
    act(() => root.unmount())
  })
})
