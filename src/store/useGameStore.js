import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { freshV2 } from '../srs/migrate.js'
import { reviewCard, newCard, Rating, State } from '../srs/scheduler.js'
import { materializeProgress } from '../srs/conf.js'
import { localDayKey, daysBetween } from '../srs/dayKey.js'
import {
  createV2Storage,
  mergeV2,
  toLogEntry,
  capLog,
  capDaily,
  capConfusionRow,
  topSpeedBests,
} from './storageV2.js'

const KEY = 'orbita-v2'
const LEGACY_KEY = 'orbita-storage'
const V2_FIELDS = [
  'schema',
  'meta',
  'cards',
  'reviewLog',
  'confusions',
  'daily',
  'stats',
  'speedRoundBests',
  'challenges',
  'settings',
]
const CAT = { locationConf: 'loc', capitalConf: 'cap', flagConf: 'flag' }

const pickV2 = (s) => Object.fromEntries(V2_FIELDS.map((k) => [k, s[k]]))

// Read-only fields the UI consumes (plain state, recomputed on every set so
// selectors re-render).
function derive(v2, nowMs) {
  const dailyActivity = {}
  for (const [day, d] of Object.entries(v2.daily || {})) dailyActivity[day] = d.reviews
  return {
    countryProgress: materializeProgress(v2.cards, nowMs),
    streak: v2.stats.streak,
    totalSessions: v2.stats.totalSessions,
    flagSessionsCompleted: v2.stats.flagSessionsCompleted,
    dailyActivity,
  }
}

// Applies a StateV2 patch and returns it together with its derived UI fields.
function withDerived(state, patch, nowMs = Date.now()) {
  const v2 = { ...pickV2(state), ...patch }
  return { ...patch, ...derive(v2, nowMs) }
}

const storage = createV2Storage({ legacyKey: LEGACY_KEY, key: KEY })

const statusFields = (status) => ({ storageStatus: status, needsReload: status === 'needsReload' })

export const useGameStore = create(
  persist(
    (set, get) => {
      const answer = (cardId, rating, nowMs, { latencyMs = null } = {}) =>
        set((s) => {
          const prev = s.cards[cardId] || newCard(nowMs)
          const wasNew = prev.state === State.New
          const { card, log } = reviewCard(prev, rating, nowMs)
          const day = localDayKey(nowMs)
          const d = s.daily[day] || { reviews: 0, new: 0 }
          return withDerived(
            s,
            {
              cards: { ...s.cards, [cardId]: card },
              reviewLog: capLog([...s.reviewLog, toLogEntry(cardId, log, latencyMs)]),
              daily: capDaily({
                ...s.daily,
                [day]: { reviews: d.reviews + 1, new: d.new + (wasNew ? 1 : 0) },
              }),
            },
            nowMs,
          )
        })

      const recordConfusion = (cardId, chosenIso3) =>
        set((s) => {
          const row = { ...(s.confusions[cardId] || {}) }
          row[chosenIso3] = (row[chosenIso3] || 0) + 1
          return { confusions: { ...s.confusions, [cardId]: capConfusionRow(row) } }
        })

      // Streak: same local day unchanged; the day after +1; otherwise 1.
      const finishSession = (_mode, _score, nowMs = Date.now()) =>
        set((s) => {
          const today = localDayKey(nowMs)
          const last = s.stats.lastSessionDay
          let streak = 1
          if (last === today) streak = s.stats.streak
          else if (last && daysBetween(last, today) === 1) streak = s.stats.streak + 1
          return withDerived(
            s,
            {
              stats: {
                ...s.stats,
                streak,
                lastSessionDay: today,
                totalSessions: s.stats.totalSessions + 1,
              },
            },
            nowMs,
          )
        })

      const addSpeedScore = (score, fraction, qpm, continent = 'all') =>
        set((s) => ({
          speedRoundBests: topSpeedBests([
            ...s.speedRoundBests,
            { score, fraction, qpm, date: new Date().toISOString(), continent },
          ]),
        }))

      const unlockPerfectContinent = (continent) =>
        set((s) => ({
          challenges: {
            ...s.challenges,
            perfectContinents: { ...s.challenges.perfectContinents, [continent]: true },
          },
        }))

      const incrementFlagSessions = () =>
        set((s) =>
          withDerived(s, {
            stats: { ...s.stats, flagSessionsCompleted: s.stats.flagSessionsCompleted + 1 },
          }),
        )

      const fresh = freshV2(Date.now())
      return {
        ...fresh,
        ...derive(fresh, Date.now()),
        ...statusFields('ok'),

        answer,
        recordConfusion,
        finishSession,
        addSpeedScore,
        unlockPerfectContinent,
        incrementFlagSessions,

        actions: {
          // DEPRECATED: removed in Task 7
          updateProgress: (countryId, type, _delta, isWrong = false) => {
            const cat = CAT[type]
            if (!cat) return
            answer(`${countryId}:${cat}`, isWrong ? Rating.Again : Rating.Good, Date.now(), {
              latencyMs: null,
            })
          },
          // DEPRECATED: removed in Task 7 (finishSession, via incrementStreak, counts the session)
          logSession: () => {},
          // DEPRECATED: removed in Task 7
          incrementStreak: () => finishSession(null, null, Date.now()),
          // DEPRECATED: removed in Task 7
          incrementFlagSessions: () => get().incrementFlagSessions(),
          // DEPRECATED: removed in Task 7
          addSpeedScore: (...args) => get().addSpeedScore(...args),
          // DEPRECATED: removed in Task 7
          unlockChallenge: (key) => {
            if (typeof key === 'string' && key.startsWith('perfect_') && key.length > 8) {
              unlockPerfectContinent(key.slice(8))
            }
          },
        },
      }
    },
    {
      name: KEY,
      version: 2,
      storage,
      partialize: pickV2,
      // Hydration and every rehydrate (storage events) merge disk into memory
      // instead of replacing it, then recompute the derived UI fields.
      merge: (persisted, current) => {
        const v2 = persisted ? mergeV2(persisted, pickV2(current)) : pickV2(current)
        return { ...current, ...v2, ...derive(v2, Date.now()), ...statusFields(storage.status) }
      },
    },
  ),
)

storage.onStatus((status) => useGameStore.setState(statusFields(status)))

// Other tabs: a v2 write is merged in on rehydrate; a write from a tab still on
// the old bundle (legacy key) is migrated and folded into v2 first.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      useGameStore.persist.rehydrate()
    } else if (e.key === LEGACY_KEY) {
      storage.absorbLegacyWrite()
      useGameStore.persist.rehydrate()
    }
  })
}
