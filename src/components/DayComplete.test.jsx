import { describe, it, expect, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import DayComplete from './DayComplete'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('DayComplete', () => {
  it('shows English copy without em dashes and starts free practice', () => {
    const onPractice = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    act(() => {
      root.render(<MemoryRouter><DayComplete onPractice={onPractice} /></MemoryRouter>)
    })
    const text = container.textContent
    expect(text).toContain('Day complete')
    expect(text).toContain('Free practice')
    expect(text).not.toContain('—')
    expect(text).not.toMatch(/Día|Práctica/)
    const button = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Free practice')
    act(() => { button.click() })
    expect(onPractice).toHaveBeenCalledTimes(1)
    act(() => root.unmount())
  })
})
