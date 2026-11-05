import { describe, it, expect } from 'vitest'
import { Rating, State } from './scheduler.js'
import { toRating } from './rating.js'

const base = { correct: true, latencyMs: 1000, hintUsed: false, inputKind: 'choice', timed: false, state: State.Review }

describe('toRating', () => {
  it('incorrect is Again', () => {
    expect(toRating({ ...base, correct: false })).toBe(Rating.Again)
  })
  it('hint gives at most Hard', () => {
    expect(toRating({ ...base, hintUsed: true })).toBeLessThanOrEqual(Rating.Hard)
    expect(toRating({ ...base, hintUsed: true, latencyMs: null })).toBe(Rating.Hard)
  })
  it('null latency is Good', () => {
    expect(toRating({ ...base, latencyMs: null })).toBe(Rating.Good)
  })
  it('never Easy for New or Learning', () => {
    expect(toRating({ ...base, state: State.New })).toBe(Rating.Good)
    expect(toRating({ ...base, state: State.Learning })).toBe(Rating.Good)
    expect(toRating({ ...base, state: State.Review })).toBe(Rating.Easy)
  })
  it('timed gives only Again or Good', () => {
    expect(toRating({ ...base, timed: true })).toBe(Rating.Good)
    expect(toRating({ ...base, timed: true, latencyMs: 99999 })).toBe(Rating.Good)
    expect(toRating({ ...base, timed: true, correct: false })).toBe(Rating.Again)
  })
  it('correct slower than slow threshold is Hard', () => {
    expect(toRating({ ...base, latencyMs: 8001 })).toBe(Rating.Hard)
    expect(toRating({ ...base, inputKind: 'typed', latencyMs: 15001 })).toBe(Rating.Hard)
    expect(toRating({ ...base, inputKind: 'globe', latencyMs: 12001 })).toBe(Rating.Hard)
  })
  it('thresholds per input kind', () => {
    expect(toRating({ ...base, latencyMs: 2500 })).toBe(Rating.Easy)
    expect(toRating({ ...base, latencyMs: 2501 })).toBe(Rating.Good)
    expect(toRating({ ...base, inputKind: 'typed', latencyMs: 5000 })).toBe(Rating.Easy)
    expect(toRating({ ...base, inputKind: 'typed', latencyMs: 5001 })).toBe(Rating.Good)
    expect(toRating({ ...base, inputKind: 'globe', latencyMs: 4000 })).toBe(Rating.Easy)
    expect(toRating({ ...base, inputKind: 'globe', latencyMs: 4001 })).toBe(Rating.Good)
    expect(toRating({ ...base, latencyMs: 8000 })).toBe(Rating.Good)
  })
  it('Relearning correct and fast is Good, not Easy', () => {
    expect(toRating({ ...base, state: State.Relearning })).toBe(Rating.Good)
  })
})
