import { describe, it, expect } from 'vitest'
import { Rating, State, newCard, reviewCard, retrievability } from './scheduler.js'

const T0 = Date.UTC(2026, 0, 10, 12, 0, 0)
const DAY = 86400000
const opts = { fuzz: false }

function toReview() {
  let c = newCard(T0)
  let now = T0
  for (let i = 0; i < 4 && c.state !== State.Review; i++) {
    c = reviewCard(c, Rating.Good, now, opts).card
    now = c.due
  }
  return { card: c, now }
}

describe('newCard', () => {
  it('has epoch ms dates and State.New', () => {
    const c = newCard(T0)
    expect(c.state).toBe(State.New)
    expect(c.due).toBe(T0)
    expect(typeof c.due).toBe('number')
    expect(c.reps).toBe(0)
  })
})

describe('reviewCard', () => {
  it('Good on a Review card pushes due past now and raises stability', () => {
    const { card, now } = toReview()
    expect(card.state).toBe(State.Review)
    const later = now + DAY
    const r = reviewCard(card, Rating.Good, later, opts)
    expect(r.card.due).toBeGreaterThan(later)
    expect(r.card.stability).toBeGreaterThan(card.stability)
    expect(typeof r.card.due).toBe('number')
    expect(typeof r.card.last_review).toBe('number')
  })

  it('Again lapses and moves to Relearning', () => {
    const { card, now } = toReview()
    const r = reviewCard(card, Rating.Again, now + DAY, opts)
    expect(r.card.lapses).toBe(card.lapses + 1)
    expect(r.card.state).toBe(State.Relearning)
  })

  it('log is [rating, tsSec, sBefore, dBefore]', () => {
    const { card, now } = toReview()
    const t = now + DAY + 500
    const r = reviewCard(card, Rating.Good, t, opts)
    expect(r.log).toEqual([Rating.Good, Math.floor(t / 1000), card.stability, card.difficulty])
  })

  it('does not mutate the input card', () => {
    const { card, now } = toReview()
    const snap = JSON.stringify(card)
    reviewCard(card, Rating.Good, now + DAY, opts)
    expect(JSON.stringify(card)).toBe(snap)
  })
})

describe('retrievability', () => {
  it('is 0 for New cards', () => {
    expect(retrievability(newCard(T0), T0)).toBe(0)
  })
  it('survives a JSON round trip', () => {
    const { card, now } = toReview()
    const at = now + 3 * DAY
    const copy = JSON.parse(JSON.stringify(card))
    expect(retrievability(copy, at)).toBe(retrievability(card, at))
    expect(retrievability(card, at)).toBeGreaterThan(0)
    expect(retrievability(card, at)).toBeLessThanOrEqual(1)
  })
})
