import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CircleTimer from './CircleTimer'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('CircleTimer (SRS-6): re-renders with a new onComplete do not reset the interval', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('one answer every 300 ms during the first 5 s: onComplete fires at t = 60 s', () => {
    const spy = vi.fn()
    let answer
    function Harness() {
      const [n, setN] = useState(0)
      answer = () => setN((x) => x + 1)
      // A fresh onComplete on every render, like SpeedRound's handleTimeUp.
      return <CircleTimer durationSeconds={60} isRunning onComplete={() => spy(n)} />
    }
    const root = createRoot(document.createElement('div'))
    act(() => { root.render(<Harness />) })

    let t = 0
    while (t + 300 <= 5000) {
      act(() => { vi.advanceTimersByTime(300) })
      t += 300
      act(() => { answer() })
    }
    act(() => { vi.advanceTimersByTime(60000 - 1 - t) })
    expect(spy).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(1) })
    expect(spy).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(spy).toHaveBeenCalledTimes(1)
    act(() => root.unmount())
  })
})
