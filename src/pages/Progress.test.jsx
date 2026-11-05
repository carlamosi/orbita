import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const countries = [
  { id: 'ESP', name: 'Spain', continent: 'Europe', flagCode: 'es' },
  { id: 'FRA', name: 'France', continent: 'Europe', flagCode: 'fr' },
  { id: 'ITA', name: 'Italy', continent: 'Europe', flagCode: 'it' },
  { id: 'DEU', name: 'Germany', continent: 'Europe', flagCode: 'de' },
]
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
import { newCard } from '../srs/scheduler'

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

  it('shows how many countries are due, and Review now goes to the game with most due cards', () => {
    const past = Date.now() - 1000
    const card = (state) => ({ state, due: past, last_review: past - 5000, reps: 1 })
    useGameStore.setState({ cards: {
      'ESP:cap': card(2), 'FRA:cap': card(2), 'ITA:flag': card(2),
      'DEU:loc': { state: 0, due: past }, // New: not counted
      'PRT:loc': { state: 2, due: Date.now() + 99999999, last_review: past, reps: 1 }, // not due
    } })
    const root = render(<Progress />)
    expect(document.body.textContent).toContain('You have 3 countries to review today')
    const link = [...document.querySelectorAll('a')].find((a) => a.textContent.includes('Review now'))
    expect(link.getAttribute('href')).toBe('/capital')
    act(() => root.unmount())
  })

  it('shows the top 3 confused pairs with names', () => {
    useGameStore.setState({ confusions: {
      'ESP:loc': { FRA: 5, ITA: 1 },
      'ITA:flag': { DEU: 3 },
      'FRA:cap': { ESP: 2 },
      'XXX:loc': { FRA: 99 },
    } })
    const root = render(<Progress />)
    const text = document.body.textContent
    expect(text).toContain('You often confuse Spain and France')
    expect(text).toContain('You often confuse Italy and Germany')
    expect(text).toContain('You often confuse France and Spain')
    expect(text).not.toContain('Italy and France')
    act(() => root.unmount())
  })

  it('requests persistent storage on mount, ignoring failures', () => {
    const persist = vi.fn(() => { throw new Error('nope') })
    Object.defineProperty(navigator, 'storage', { value: { persist }, configurable: true })
    const root = render(<Progress />)
    expect(persist).toHaveBeenCalledTimes(1)
    act(() => root.unmount())
    delete navigator.storage
  })

  it('import of invalid file shows an error and leaves the state unchanged', async () => {
    vi.useRealTimers()
    const root = render(<Progress />)
    const input = document.querySelector('input[type="file"]')
    const file = new File(['{nope'], 'x.json', { type: 'application/json' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    const before = useGameStore.getState().cards
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); await new Promise((r) => setTimeout(r, 50)) })
    expect(document.querySelector('[role="alert"]').textContent).toMatch(/progress/i)
    expect(useGameStore.getState().cards).toBe(before)
    act(() => root.unmount())
  })

  it('import of a file with a null card shows a friendly message and keeps the store', async () => {
    vi.useRealTimers()
    const root = render(<Progress />)
    const input = document.querySelector('input[type="file"]')
    const json = JSON.stringify({ schema: 2, cards: { 'ESP:loc': null } })
    Object.defineProperty(input, 'files', { value: [new File([json], 'x.json')], configurable: true })
    const before = useGameStore.getState().cards
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); await new Promise((r) => setTimeout(r, 50)) })
    expect(document.querySelector('[role="alert"]').textContent).toBe('This progress backup contains invalid cards.')
    expect(useGameStore.getState().cards).toBe(before)
    act(() => root.unmount())
  })

  it('import of a valid file merges into the store', async () => {
    vi.useRealTimers()
    const root = render(<Progress />)
    const imported = { ...useGameStore.getState(), cards: { 'ESP:loc': { ...newCard(1000), state: 2, last_review: 5, reps: 1 } } }
    const json = JSON.stringify({ schema: 2, cards: imported.cards })
    const input = document.querySelector('input[type="file"]')
    Object.defineProperty(input, 'files', { value: [new File([json], 'x.json')], configurable: true })
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); await new Promise((r) => setTimeout(r, 50)) })
    expect(Object.keys(useGameStore.getState().cards)).toContain('ESP:loc')
    act(() => root.unmount())
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
