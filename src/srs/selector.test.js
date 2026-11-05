import { describe, it, expect } from 'vitest'
import countries from '../data/countries.json'
import { buildSession } from './selector.js'
import { State, retrievability } from './scheduler.js'
import { freshV2 } from './migrate.js'

const MIN = 60000
const DAY = 86400000
const NOW = Date.parse('2026-11-05T10:00:00Z')

// Tiny seeded rng (mulberry32), test-only.
function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function card(state, { due = NOW, stability = 5, lastReview = NOW - 3 * DAY, lapses = 0 } = {}) {
  return {
    due,
    stability,
    difficulty: 5,
    scheduled_days: 3,
    learning_steps: 0,
    reps: state === State.New ? 0 : 3,
    lapses,
    state,
    last_review: state === State.New ? null : lastReview,
  }
}

const isDueReview = (state, cardId, nowMs) => {
  const c = state.cards[cardId]
  return !!c && c.state === State.Review && c.due <= nowMs
}

function randomState(rng, nowMs) {
  const s = freshV2(nowMs)
  const cats = ['loc', 'cap', 'flag']
  for (const c of countries) {
    for (const cat of cats) {
      const r = rng()
      if (r < 0.4) continue
      const kind = Math.floor(rng() * 4)
      const state = [State.New, State.Learning, State.Review, State.Relearning][kind]
      const due = nowMs + Math.floor((rng() - 0.5) * 20 * DAY)
      const stability = 0.5 + rng() * 60
      const lastReview = nowMs - Math.floor(rng() * 30 * DAY)
      s.cards[`${c.id}:${cat}`] = card(state, {
        due,
        stability,
        lastReview,
        lapses: Math.floor(rng() * 4),
      })
      if (rng() < 0.2) s.confusions[`${c.id}:${cat}`] = { FRA: Math.floor(rng() * 5) }
    }
  }
  s.daily[new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(nowMs)] = {
    reviews: 0,
    new: Math.floor(rng() * 12),
  }
  return s
}

describe('buildSession', () => {
  it('returns {cardId, iso3, isNew, practice} entries, no duplicates, at most size', () => {
    const out = buildSession(freshV2(NOW), { nowMs: NOW, cat: 'loc', pool: countries, rng: seeded(1) })
    expect(out.length).toBeGreaterThan(0)
    expect(out.length).toBeLessThanOrEqual(20)
    for (const e of out) {
      expect(Object.keys(e).sort()).toEqual(['cardId', 'isNew', 'iso3', 'practice'])
      expect(e.cardId).toBe(`${e.iso3}:loc`)
    }
    expect(new Set(out.map((e) => e.cardId)).size).toBe(out.length)
  })

  it('never repeats iso3 in consecutive positions (200 seeded states)', () => {
    const rng = seeded(42)
    for (let i = 0; i < 200; i++) {
      const nowMs = NOW + Math.floor(rng() * 30 * DAY)
      const s = randomState(rng, nowMs)
      const cat = ['loc', 'cap', 'flag'][i % 3]
      const out = buildSession(s, { nowMs, cat, pool: countries, rng: seeded(i) })
      expect(out.length).toBeLessThanOrEqual(20)
      expect(new Set(out.map((e) => e.cardId)).size).toBe(out.length)
      for (let k = 1; k < out.length; k++) expect(out[k].iso3).not.toBe(out[k - 1].iso3)
    }
  })

  it('no New appears before a due Review (200 seeded states)', () => {
    const rng = seeded(7)
    for (let i = 0; i < 200; i++) {
      const nowMs = NOW + Math.floor(rng() * 30 * DAY)
      const s = randomState(rng, nowMs)
      const out = buildSession(s, { nowMs, cat: 'loc', pool: countries, rng: seeded(i) })
      const firstNew = out.findIndex((e) => e.isNew)
      if (firstNew === -1) continue
      const lastDue = out.map((e) => isDueReview(s, e.cardId, nowMs)).lastIndexOf(true)
      expect(lastDue).toBeLessThan(firstNew)
    }
  })

  it('due Reviews come out ordered by R ascending', () => {
    const rng = seeded(9)
    for (let i = 0; i < 50; i++) {
      const nowMs = NOW + Math.floor(rng() * 30 * DAY)
      const s = randomState(rng, nowMs)
      const out = buildSession(s, { nowMs, cat: 'cap', pool: countries, rng: seeded(i) })
      const rs = out
        .filter((e) => isDueReview(s, e.cardId, nowMs))
        .map((e) => retrievability(s.cards[e.cardId], nowMs))
      for (let k = 1; k < rs.length; k++) expect(rs[k]).toBeGreaterThanOrEqual(rs[k - 1])
    }
  })

  it('due Review ties break by lapses desc, then confusions desc, then id', () => {
    const s = freshV2(NOW)
    const base = { due: NOW - DAY, stability: 4, lastReview: NOW - 4 * DAY }
    s.cards['ESP:loc'] = card(State.Review, { ...base, lapses: 1 })
    s.cards['FRA:loc'] = card(State.Review, { ...base, lapses: 3 })
    s.cards['DEU:loc'] = card(State.Review, { ...base, lapses: 1 })
    s.cards['ITA:loc'] = card(State.Review, { ...base, lapses: 1 })
    s.confusions['ITA:loc'] = { ESP: 2, FRA: 1 }
    const pool = countries.filter((c) => ['ESP', 'FRA', 'DEU', 'ITA'].includes(c.id))
    const out = buildSession(s, { nowMs: NOW, cat: 'loc', pool, rng: seeded(3) })
    expect(out.map((e) => e.iso3)).toEqual(['FRA', 'ITA', 'DEU', 'ESP'])
  })

  it('Learning/Relearning due within 20 min come first, ordered by due', () => {
    const s = freshV2(NOW)
    s.cards['ESP:loc'] = card(State.Review, { due: NOW - DAY })
    s.cards['FRA:loc'] = card(State.Learning, { due: NOW + 15 * MIN })
    s.cards['DEU:loc'] = card(State.Relearning, { due: NOW + 5 * MIN })
    s.cards['ITA:loc'] = card(State.Learning, { due: NOW + 25 * MIN })
    const pool = countries.filter((c) => ['ESP', 'FRA', 'DEU', 'ITA'].includes(c.id))
    const out = buildSession(s, { nowMs: NOW, cat: 'loc', pool, rng: seeded(3) })
    expect(out.map((e) => e.iso3)).toEqual(['DEU', 'FRA', 'ESP'])
    expect(out.every((e) => !e.isNew && !e.practice)).toBe(true)
  })

  it('has at most dailyNew - introducidasHoy new cards', () => {
    const rng = seeded(11)
    for (let i = 0; i < 100; i++) {
      const nowMs = NOW + Math.floor(rng() * 30 * DAY)
      const s = randomState(rng, nowMs)
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(nowMs)
      const quota = Math.max(0, s.settings.dailyNew - (s.daily[today]?.new ?? 0))
      const out = buildSession(s, { nowMs, cat: 'flag', pool: countries, rng: seeded(i) })
      expect(out.filter((e) => e.isNew).length).toBeLessThanOrEqual(quota)
    }
    const s = freshV2(NOW)
    s.daily['2026-11-05'] = { reviews: 3, new: 7 }
    const out = buildSession(s, { nowMs: NOW, cat: 'loc', pool: countries, rng: seeded(1) })
    expect(out.filter((e) => e.isNew).length).toBe(3)
  })

  it('new quota resets at Madrid midnight: 2026-11-05T23:30:00Z counts as Nov 6', () => {
    const nowMs = Date.parse('2026-11-05T23:30:00Z')
    const s = freshV2(nowMs)
    s.daily['2026-11-05'] = { reviews: 40, new: 10 }
    const fresh = buildSession(s, { nowMs, cat: 'loc', pool: countries, rng: seeded(1) })
    expect(fresh.filter((e) => e.isNew).length).toBeGreaterThan(0)

    s.daily['2026-11-06'] = { reviews: 5, new: 10 }
    const spent = buildSession(s, { nowMs, cat: 'loc', pool: countries, rng: seeded(1) })
    expect(spent.filter((e) => e.isNew).length).toBe(0)
  })

  it('New ordering: migrated weak spots by lapses desc, then easy<medium<hard, population desc', () => {
    const s = freshV2(NOW)
    s.settings.dailyNew = 50
    s.cards['MCO:loc'] = card(State.New, { lapses: 2 })
    s.cards['VAT:loc'] = card(State.New, { lapses: 5 })
    const out = buildSession(s, { nowMs: NOW, cat: 'loc', pool: countries, size: 20, rng: seeded(1) })
    const news = out.filter((e) => e.isNew).map((e) => e.iso3)
    expect(news.slice(0, 2)).toEqual(['VAT', 'MCO'])
    const rank = { easy: 0, medium: 1, hard: 2 }
    const byId = Object.fromEntries(countries.map((c) => [c.id, c]))
    const rest = news.slice(2).map((id) => byId[id])
    for (let k = 1; k < rest.length; k++) {
      const a = rest[k - 1]
      const b = rest[k]
      const ok =
        rank[a.difficulty] < rank[b.difficulty] ||
        (rank[a.difficulty] === rank[b.difficulty] && a.population >= b.population)
      expect(ok).toBe(true)
    }
  })

  it('at most 1 new every 3 positions while non-new fillers exist; fillers are practice', () => {
    const s = freshV2(NOW)
    // 30 Review cards not yet due -> practice fillers available.
    for (const c of countries.slice(0, 30)) {
      s.cards[`${c.id}:cap`] = card(State.Review, { due: NOW + 5 * DAY, stability: 10 })
    }
    const out = buildSession(s, { nowMs: NOW, cat: 'cap', pool: countries, rng: seeded(5) })
    expect(out.length).toBe(20)
    expect(out.filter((e) => e.isNew).length).toBe(7)
    for (let k = 0; k < out.length; k++) {
      if (!out[k].isNew) continue
      for (let j = k + 1; j < Math.min(out.length, k + 3); j++) expect(out[j].isNew).toBe(false)
    }
    for (const e of out) if (!e.isNew) expect(e.practice).toBe(true)
    // practice fillers by R ascending
    const rs = out.filter((e) => e.practice).map((e) => retrievability(s.cards[e.cardId], NOW))
    for (let k = 1; k < rs.length; k++) expect(rs[k]).toBeGreaterThanOrEqual(rs[k - 1])
  })

  it('a fresh state still gets a session of new cards up to the quota', () => {
    const out = buildSession(freshV2(NOW), { nowMs: NOW, cat: 'loc', pool: countries, rng: seeded(1) })
    expect(out.length).toBe(10)
    expect(out.every((e) => e.isNew && !e.practice)).toBe(true)
  })

  it('returns fewer than size when the pool is small', () => {
    const pool = countries.slice(0, 3)
    const out = buildSession(freshV2(NOW), { nowMs: NOW, cat: 'loc', pool, rng: seeded(1) })
    expect(out.length).toBe(3)
  })

  it('is deterministic for the same state, now and seed', () => {
    const s = randomState(seeded(99), NOW)
    const a = buildSession(s, { nowMs: NOW, cat: 'loc', pool: countries, rng: seeded(123) })
    const b = buildSession(s, { nowMs: NOW, cat: 'loc', pool: countries, rng: seeded(123) })
    expect(b).toEqual(a)
  })

  it('an empty or missing pool equals the default pool', () => {
    const s = randomState(seeded(5), NOW)
    const full = buildSession(s, { nowMs: NOW, cat: 'cap', pool: countries, rng: seeded(8) })
    expect(buildSession(s, { nowMs: NOW, cat: 'cap', pool: [], rng: seeded(8) })).toEqual(full)
    expect(buildSession(s, { nowMs: NOW, cat: 'cap', rng: seeded(8) })).toEqual(full)
  })
})
