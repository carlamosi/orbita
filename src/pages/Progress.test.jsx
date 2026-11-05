import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const countries = [{ id: 'ESP', name: 'Spain', continent: 'Europe', flagCode: 'es' }]
const geoData = { features: [
  { id: 'ESP', properties: { name: 'Spain' }, geometry: { type: 'Polygon', coordinates: [[[0, 40], [10, 40], [10, 50], [0, 40]]] } },
] }
vi.mock('../context/WorldDataContext', () => ({
  useWorldData: () => ({ countries, geoData, isLoading: false }),
}))
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const strip = ({ initial, animate, exit, transition, layout, whileInView, viewport, ...rest }) => rest
  const motion = new Proxy({}, {
    get: (_, tag) => React.forwardRef((props, ref) => React.createElement(tag, { ...strip(props), ref })),
  })
  return { motion, AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children) }
})

import { useGameStore } from '../store/useGameStore'
import Progress from './Progress.jsx'

const initial = useGameStore.getState()

function render(ui) {
  const root = createRoot(document.body.appendChild(document.createElement('div')))
  act(() => { root.render(<MemoryRouter>{ui}</MemoryRouter>) })
  return root
}
const statText = (label) => {
  const el = [...document.querySelectorAll('div')].find((d) => d.textContent === label)
  return el.nextElementSibling.textContent
}

describe('Progress and heatmap', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    useGameStore.setState({ ...initial, cards: {}, reviewLog: [], daily: {}, confusions: {}, dailyActivity: {}, countryProgress: {} })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T12:00:00+01:00'))
  })
  afterEach(() => { vi.useRealTimers() })

  const setStats = (s) => useGameStore.setState({ stats: { ...useGameStore.getState().stats, ...s }, streak: s.streak })

  it('streak last played 3 days ago shows 0', () => {
    setStats({ streak: 5, lastSessionDay: '2026-11-02' })
    const root = render(<Progress />)
    expect(statText('Current Streak').trim()).toMatch(/^0/)
    act(() => root.unmount())
  })

  it('streak played yesterday is kept', () => {
    setStats({ streak: 5, lastSessionDay: '2026-11-04' })
    const root = render(<Progress />)
    expect(statText('Current Streak').trim()).toMatch(/^5/)
    act(() => root.unmount())
  })

  it('Avg Accuracy is correct reviews over reviewLog, 0% when empty', () => {
    const root = render(<Progress />)
    expect(statText('Avg Accuracy')).toBe('0%')
    act(() => root.unmount())
    document.body.innerHTML = ''
    useGameStore.setState({ reviewLog: [['ESP:loc', 1, 1, 0, 0, null], ['ESP:loc', 3, 2, 0, 0, null], ['ESP:cap', 4, 3, 0, 0, null]] })
    const r2 = render(<Progress />)
    expect(statText('Avg Accuracy')).toBe('67%')
    act(() => r2.unmount())
  })

  it('heatmap and Progress agree on a 60/60/60 country (and on 59)', () => {
    useGameStore.setState({ countryProgress: { ESP: { locationConf: 60, capitalConf: 60, flagConf: 60, timesWrong: 0 } } })
    let root = render(<Progress />)
    expect(statText('Mastered')).toBe('1')
    expect(document.querySelector('path').getAttribute('fill')).toBe('#00FFB2')
    act(() => root.unmount())
    document.body.innerHTML = ''
    useGameStore.setState({ countryProgress: { ESP: { locationConf: 59, capitalConf: 100, flagConf: 100, timesWrong: 0 } } })
    root = render(<Progress />)
    expect(statText('Mastered')).toBe('0')
    expect(document.querySelector('path').getAttribute('fill')).not.toBe('#00FFB2')
    act(() => root.unmount())
  })
})
