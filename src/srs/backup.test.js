import { describe, it, expect } from 'vitest'
import { exportProgress, importProgress } from './backup.js'
import { freshV2 } from './migrate.js'
import { newCard } from './scheduler.js'

const sample = () => ({
  ...freshV2(1000),
  cards: { 'ESP:loc': { ...newCard(1000), reps: 2, last_review: 5000 } },
  reviewLog: [['ESP:loc', 3, 5, 1.2, 4.5, null]],
  confusions: { 'ESP:loc': { FRA: 2 } },
  daily: { '2026-11-05': { reviews: 1, new: 1 } },
  stats: { streak: 2, lastSessionDay: '2026-11-05', totalSessions: 3, flagSessionsCompleted: 1 },
})

describe('backup', () => {
  it('round trip: import(export(s), fresh) equals s', () => {
    const s = sample()
    expect(importProgress(exportProgress(s), freshV2(1000))).toEqual(s)
  })

  it('accepts a persisted wrapper {state, version}', () => {
    const s = sample()
    const json = JSON.stringify({ state: s, version: 2 })
    expect(importProgress(json, freshV2(1000))).toEqual(s)
  })

  it('merges with current progress instead of replacing it', () => {
    const s = sample()
    const current = { ...freshV2(1000), cards: { 'FRA:cap': { ...newCard(1000), reps: 1, last_review: 9 } } }
    const out = importProgress(exportProgress(s), current)
    expect(Object.keys(out.cards).sort()).toEqual(['ESP:loc', 'FRA:cap'])
  })

  it.each([
    ['not json', '{nope'],
    ['wrong schema', JSON.stringify({ schema: 1, cards: {} })],
    ['cards not an object', JSON.stringify({ schema: 2, cards: [] })],
    ['null', 'null'],
    ['no cards', JSON.stringify({ schema: 2 })],
  ])('invalid input (%s) throws a readable Error and leaves current untouched', (_n, json) => {
    const current = sample()
    const before = JSON.stringify(current)
    expect(() => importProgress(json, current)).toThrow(Error)
    expect(() => importProgress(json, current)).toThrow(/progress/i)
    expect(JSON.stringify(current)).toBe(before)
  })
})
