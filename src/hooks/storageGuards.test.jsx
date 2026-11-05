import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

vi.mock('howler', () => ({ Howl: class { play() {} } }))

import { useSounds } from './useSounds'
import { useKeyboard } from './useKeyboard'

afterEach(() => vi.restoreAllMocks())

function block() {
  const err = () => { throw new DOMException('blocked', 'SecurityError') }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(err)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(err)
}

describe('storage guards', () => {
  it('useSounds renders and toggles with localStorage blocked', () => {
    block()
    let api
    function C() { api = useSounds(); return null }
    const root = createRoot(document.body.appendChild(document.createElement('div')))
    act(() => { root.render(<C />) })
    expect(api.muted).toBe(false)
    act(() => { api.toggleMute() })
    expect(api.muted).toBe(true)
  })

  it('useKeyboard still calls the handler when localStorage throws', () => {
    block()
    const fn = vi.fn()
    function C() { useKeyboard({ 1: fn }); return null }
    const root = createRoot(document.body.appendChild(document.createElement('div')))
    act(() => { root.render(<C />) })
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' })) })
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
