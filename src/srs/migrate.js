import { newCard, State } from './scheduler.js'
import { cardConf } from './conf.js'

// Pure v0 (Zustand 'orbita-storage', version 0) -> v2 migration.
// No storage access and no clock: everything comes from the arguments.

const CATS = [
  ['loc', 'locationConf'],
  ['cap', 'capitalConf'],
  ['flag', 'flagConf'],
]
const S_MIN = 0.5
const S_MAX = 365
const MAX_DAYS = 400
const MAX_SPEED_BESTS = 10
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86400000
const SEED_HORIZON_MS = 7 * DAY_MS

export function freshV2(nowMs) {
  return {
    schema: 2,
    meta: { migratedFrom: null, migratedAt: nowMs },
    cards: {},
    reviewLog: [],
    confusions: {},
    daily: {},
    stats: { streak: 0, lastSessionDay: null, totalSessions: 0, flagSessionsCompleted: 0 },
    speedRoundBests: [],
    challenges: { perfectContinents: {} },
    settings: { dailyNew: 10, desiredRetention: 0.9 },
  }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const finite = (v) => typeof v === 'number' && Number.isFinite(v)
const count = (v) => (finite(v) && v > 0 ? Math.floor(v) : 0)

function seededCard(conf, timesWrong, lapses, nowMs) {
  const card = {
    ...newCard(nowMs),
    state: State.Review,
    difficulty: clamp(5 + timesWrong * 0.5, 1, 10),
    last_review: nowMs,
    reps: 1,
    lapses,
  }
  // Target is checked a week out so seeded mastery survives 7 days without review.
  // R only decays, so conf at nowMs is >= conf too.
  const confAt = (s) => cardConf({ ...card, stability: s }, nowMs + SEED_HORIZON_MS)
  let stability = S_MAX
  if (confAt(S_MIN) >= conf) {
    stability = S_MIN
  } else if (confAt(S_MAX) >= conf) {
    // Smallest S in (S_MIN, S_MAX] with confAt(S) >= conf. confAt is monotone in S.
    let lo = S_MIN
    let hi = S_MAX
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2
      if (confAt(mid) >= conf) hi = mid
      else lo = mid
    }
    stability = hi
  }
  // Due at the FSRS interval for retention 0.9 (R(S) = 0.9), not all due on day one.
  const scheduled_days = Math.round(stability)
  return { ...card, stability, scheduled_days, due: nowMs + scheduled_days * DAY_MS }
}

function migrateCards(countryProgress, nowMs, validIds) {
  const cards = {}
  if (!isObj(countryProgress)) return cards
  const isos = Object.keys(countryProgress)
  if (isos.length > 0 && !isos.some((iso) => validIds.has(iso))) {
    throw new Error(
      `migrateV0toV2: none of the ${isos.length} v0 countryProgress ids is in validIds; refusing to drop all progress`,
    )
  }
  for (const [iso, p] of Object.entries(countryProgress)) {
    if (!validIds.has(iso) || !isObj(p)) continue
    const timesWrong = count(p.timesWrong)
    // materializeProgress sums lapses over a country's cards, so the whole
    // timesWrong goes on the first seeded card (loc, cap, flag) and 0 on the rest.
    let lapsesLeft = timesWrong
    for (const [cat, field] of CATS) {
      const raw = p[field]
      if (!finite(raw)) continue
      const conf = clamp(raw, 0, 100)
      if (conf <= 0) continue
      cards[`${iso}:${cat}`] = seededCard(conf, timesWrong, lapsesLeft, nowMs)
      lapsesLeft = 0
    }
    // Weak spot with every Conf at 0: keep its timesWrong on a New loc card.
    if (lapsesLeft > 0) cards[`${iso}:loc`] = { ...newCard(nowMs), lapses: lapsesLeft }
  }
  return cards
}

function migrateDaily(dailyActivity) {
  if (!isObj(dailyActivity)) return {}
  const days = Object.keys(dailyActivity)
    .filter((k) => DAY_KEY.test(k) && finite(dailyActivity[k]) && dailyActivity[k] >= 0)
    .sort()
    .slice(-MAX_DAYS)
  const daily = {}
  for (const k of days) daily[k] = { reviews: Math.floor(dailyActivity[k]), new: 0 }
  return daily
}

function migrateChallenges(challenges) {
  const perfectContinents = {}
  if (!isObj(challenges)) return { perfectContinents }
  if (isObj(challenges.perfectContinents)) Object.assign(perfectContinents, challenges.perfectContinents)
  for (const [key, value] of Object.entries(challenges)) {
    if (key.startsWith('perfect_') && key.length > 'perfect_'.length && value) {
      perfectContinents[key.slice('perfect_'.length)] = true
    }
  }
  return { perfectContinents }
}

// rawV0: persisted wrapper {state, version} or the bare state object.
// Throws (instead of returning an empty v2 that would be persisted) when the
// arguments cannot be trusted; the caller stays in legacy mode.
export function migrateV0toV2(rawV0, nowMs, validIds) {
  if (!finite(nowMs)) throw new Error(`migrateV0toV2: nowMs must be a finite number, got ${nowMs}`)
  if (!(validIds instanceof Set) || validIds.size === 0) {
    throw new Error('migrateV0toV2: validIds must be a non-empty Set of ISO3 ids')
  }
  if (!isObj(rawV0)) return freshV2(nowMs)
  if (rawV0.schema === 2) return rawV0
  const s = isObj(rawV0.state) ? rawV0.state : rawV0
  const lastSessionDay =
    typeof s.lastSession === 'string' && DAY_KEY.test(s.lastSession) ? s.lastSession : null

  return {
    ...freshV2(nowMs),
    meta: { migratedFrom: 0, migratedAt: nowMs },
    cards: migrateCards(s.countryProgress, nowMs, validIds),
    daily: migrateDaily(s.dailyActivity),
    stats: {
      streak: count(s.streak),
      lastSessionDay,
      totalSessions: count(s.totalSessions),
      flagSessionsCompleted: count(s.flagSessionsCompleted),
    },
    speedRoundBests: Array.isArray(s.speedRoundBests)
      ? s.speedRoundBests.slice(0, MAX_SPEED_BESTS).map((b) => (isObj(b) ? { ...b } : b))
      : [],
    challenges: migrateChallenges(s.challenges),
  }
}
