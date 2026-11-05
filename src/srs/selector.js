import countries from '../data/countries.json'
import { State, retrievability } from './scheduler.js'
import { localDayKey } from './dayKey.js'

// Session selector: which cards a study session asks, and in what order.
// Pure: everything comes from the arguments. `rng` only breaks ties that the
// documented sort keys leave open, so same (state, nowMs, rng seed) -> same output.

const LEARNING_WINDOW_MS = 20 * 60 * 1000
const NEW_SPACING = 3 // at most 1 new card every 3 positions
const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 }
const DEFAULT_DAILY_NEW = 10

const byId = (a, b) => (a.cardId < b.cardId ? -1 : a.cardId > b.cardId ? 1 : 0)

function confusionTotal(confusions, cardId) {
  const row = confusions && confusions[cardId]
  if (!row) return 0
  let sum = 0
  for (const v of Object.values(row)) if (Number.isFinite(v)) sum += v
  return sum
}

// Takes the first item of `queue` whose iso3 differs from `lastIso`, or null.
function takeFrom(queue, lastIso) {
  const i = queue.findIndex((c) => c.iso3 !== lastIso)
  return i === -1 ? null : queue.splice(i, 1)[0]
}

export function buildSession(state, { nowMs, cat, pool, size = 20, rng = Math.random } = {}) {
  const source = Array.isArray(pool) && pool.length > 0 ? pool : countries
  const seen = new Set()
  const candidates = []
  for (const country of source) {
    if (!country || seen.has(country.id)) continue
    seen.add(country.id)
    const cardId = `${country.id}:${cat}`
    candidates.push({ cardId, iso3: country.id, country, card: state?.cards?.[cardId] })
  }
  // Tie-break draws in id order, independent of pool order.
  candidates.sort(byId)
  for (const c of candidates) c.tie = rng()

  const learning = []
  const dueReview = []
  const fresh = []
  const practice = []
  for (const c of candidates) {
    const card = c.card
    if (!card || card.state === State.New) {
      fresh.push(c)
    } else if (card.state === State.Learning || card.state === State.Relearning) {
      if (card.due <= nowMs + LEARNING_WINDOW_MS) learning.push(c)
    } else if (card.state === State.Review) {
      c.r = retrievability(card, nowMs)
      if (card.due <= nowMs) {
        c.lapses = card.lapses || 0
        c.conf = confusionTotal(state.confusions, c.cardId)
        dueReview.push(c)
      } else {
        practice.push(c)
      }
    }
  }

  learning.sort((a, b) => a.card.due - b.card.due || a.tie - b.tie || byId(a, b))
  dueReview.sort((a, b) => a.r - b.r || b.lapses - a.lapses || b.conf - a.conf || byId(a, b))
  practice.sort((a, b) => a.r - b.r || a.tie - b.tie || byId(a, b))
  // New: migrated weak spots (card object with lapses > 0) first by lapses desc,
  // then everything else by difficulty easy<medium<hard, then population desc.
  const weak = (c) => (c.card && c.card.lapses > 0 ? c.card.lapses : 0)
  const diff = (c) => DIFFICULTY_RANK[c.country.difficulty] ?? DIFFICULTY_RANK.hard
  fresh.sort(
    (a, b) =>
      weak(b) - weak(a) ||
      diff(a) - diff(b) ||
      (b.country.population || 0) - (a.country.population || 0) ||
      a.tie - b.tie ||
      byId(a, b),
  )

  const dailyNew = state?.settings?.dailyNew ?? DEFAULT_DAILY_NEW
  const introducedToday = state?.daily?.[localDayKey(nowMs)]?.new ?? 0
  const quota = Math.max(0, dailyNew - introducedToday)

  const out = []
  let lastIso = null
  const push = (c, isNew, isPractice) => {
    out.push({ cardId: c.cardId, iso3: c.iso3, isNew, practice: isPractice })
    lastIso = c.iso3
  }

  // 1 + 2: mandatory cards (Learning/Relearning soon due, then due Reviews).
  for (const queue of [learning, dueReview]) {
    while (out.length < size && queue.length > 0) {
      const c = takeFrom(queue, lastIso)
      if (!c) break
      push(c, false, false)
    }
  }

  // 3 + 4: new cards spaced among practice fillers. All due Reviews are already placed,
  // so no new card precedes one.
  const news = fresh.slice(0, quota)
  let lastNewPos = -Infinity
  while (out.length < size) {
    const pos = out.length
    let c = null
    if (news.length > 0 && pos - lastNewPos >= NEW_SPACING) {
      c = takeFrom(news, lastIso)
      if (c) {
        lastNewPos = pos
        push(c, true, false)
        continue
      }
    }
    c = takeFrom(practice, lastIso)
    if (c) {
      push(c, false, true)
      continue
    }
    // No filler left: place remaining new cards rather than end the session early.
    if (news.length > 0) {
      c = takeFrom(news, lastIso)
      if (c) {
        lastNewPos = pos
        push(c, true, false)
        continue
      }
    }
    break
  }

  return out
}
