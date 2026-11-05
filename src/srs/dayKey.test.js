import { describe, it, expect } from 'vitest'
import { localDayKey, daysBetween } from './dayKey'

describe('test environment', () => {
  it('runs in Europe/Madrid', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Madrid')
  })
})

describe('localDayKey', () => {
  it('00:30 Madrid counts for the new day', () => {
    expect(localDayKey(Date.parse('2026-11-06T00:30:00+01:00'), 'Europe/Madrid')).toBe('2026-11-06')
  })
  it('autumn DST change day', () => {
    expect(localDayKey(Date.parse('2026-10-25T01:30:00+01:00'), 'Europe/Madrid')).toBe('2026-10-25')
  })
  it('spring DST change day', () => {
    expect(localDayKey(Date.parse('2026-03-29T03:30:00+02:00'), 'Europe/Madrid')).toBe('2026-03-29')
  })
  it('uses the device zone when timeZone is omitted', () => {
    const ms = Date.parse('2026-11-06T00:30:00+01:00')
    expect(localDayKey(ms)).toBe('2026-11-06')
    expect(localDayKey(ms)).toBe(localDayKey(ms, Intl.DateTimeFormat().resolvedOptions().timeZone))
  })
  it('differs from the UTC key at 00:30 Madrid', () => {
    const ms = Date.parse('2026-11-06T00:30:00+01:00')
    expect(new Date(ms).toISOString().split('T')[0]).toBe('2026-11-05')
    expect(localDayKey(ms, 'Europe/Madrid')).toBe('2026-11-06')
  })
})

describe('daysBetween', () => {
  it('spring DST gap is 1 day', () => {
    expect(daysBetween('2026-03-28', '2026-03-29')).toBe(1)
  })
  it('autumn DST span is 2 days', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })
  it('is negative when reversed', () => {
    expect(daysBetween('2026-10-26', '2026-10-24')).toBe(-2)
  })
})
