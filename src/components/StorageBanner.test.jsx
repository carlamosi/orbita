import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useGameStore } from '../store/useGameStore'
import StorageBanner from './StorageBanner.jsx'
import { STORAGE_MESSAGES } from './storageMessage.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const initial = useGameStore.getState()
let root

function render() {
  root = createRoot(document.body.appendChild(document.createElement('div')))
  act(() => { root.render(<StorageBanner />) })
}
const setStatus = (storageStatus) =>
  useGameStore.setState({ storageStatus, needsReload: storageStatus === 'needsReload' })

describe('StorageBanner', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    useGameStore.setState(initial, true)
  })
  afterEach(() => {
    act(() => root.unmount())
    vi.restoreAllMocks()
  })

  it('renders nothing when storage is ok', () => {
    setStatus('ok')
    render()
    expect(document.body.textContent).toBe('')
    expect(document.querySelector('[role="alert"]')).toBeNull()
  })

  it.each([
    ['unavailable', STORAGE_MESSAGES.notWritable],
    ['legacy-error', STORAGE_MESSAGES.notWritable],
    ['corrupt', STORAGE_MESSAGES.notWritable],
    ['quota-error', STORAGE_MESSAGES.quota],
    ['needsReload', STORAGE_MESSAGES.needsReload],
  ])('status %s shows its message', (status, text) => {
    setStatus(status)
    render()
    expect(document.querySelector('[role="alert"]').textContent).toContain(text)
  })

  it('needsReload shows a Reload button that reloads the page', () => {
    const reload = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload })
    setStatus('needsReload')
    render()
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Reload')
    expect(btn).toBeDefined()
    act(() => btn.click())
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('only needsReload has a Reload button', () => {
    setStatus('unavailable')
    render()
    expect(document.querySelector('button')).toBeNull()
  })

  it('reacts to a status change after mount', () => {
    setStatus('ok')
    render()
    expect(document.body.textContent).toBe('')
    act(() => setStatus('quota-error'))
    expect(document.body.textContent).toContain(STORAGE_MESSAGES.quota)
  })

  it('no message uses an em dash', () => {
    for (const t of Object.values(STORAGE_MESSAGES)) expect(t).not.toContain('—')
  })
})
