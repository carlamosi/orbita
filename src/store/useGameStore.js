import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ── State ──
      streak: 0,
      lastSession: null,
      totalSessions: 0,
      countryProgress: {}, // { 'BOL': { locationConf: 0, capitalConf: 0, flagConf: 0, timesWrong: 0 } }
      activityLog: [],
      dailyActivity: {}, // { '2026-04-05': count }
      speedRoundBests: [], // [ { score, fraction, qpm, date, continent } ]
      flagSessionsCompleted: 0,
      challenges: {
        perfectContinents: {}, // { 'Europe': true }
      },

      // ── Actions ──
      actions: {
        updateProgress: (countryId, type, delta, isWrong = false) => set((state) => {
          const prev = state.countryProgress[countryId] || {
             locationConf: 0, capitalConf: 0, flagConf: 0, timesWrong: 0
          }
          return {
            countryProgress: {
              ...state.countryProgress,
              [countryId]: {
                ...prev,
                [type]: Math.max(0, Math.min(100, prev[type] + delta)),
                timesWrong: isWrong ? prev.timesWrong + 1 : prev.timesWrong
              }
            }
          }
        }),

        incrementStreak: () => set((state) => {
          const today = new Date().toISOString().split('T')[0]
          const last = state.lastSession
          if (last === today) return state

          let newStreak = 1
          if (last) {
            const diffDays = Math.round(
              (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24)
            )
            newStreak = diffDays === 1 ? state.streak + 1 : 1
          }

          return {
            streak: newStreak,
            lastSession: today,
            totalSessions: state.totalSessions + 1
          }
        }),

        logSession: (gameMode, score) => set((state) => {
          const dateStr = new Date().toISOString().split('T')[0]
          return {
            activityLog: [
              { mode: gameMode, score, date: new Date().toISOString() },
              ...state.activityLog
            ].slice(0, 100),
            dailyActivity: {
              ...state.dailyActivity,
              [dateStr]: (state.dailyActivity[dateStr] || 0) + 1
            }
          }
        }),

        incrementFlagSessions: () => set((state) => ({
          flagSessionsCompleted: state.flagSessionsCompleted + 1
        })),

        unlockChallenge: (key, value = true) => set((state) => ({
          challenges: { ...state.challenges, [key]: value }
        })),

        addSpeedScore: (score, fraction, qpm, continent = 'all') => set((state) => {
          const entry = { score, fraction, qpm, date: new Date().toISOString(), continent }
          const newBests = [...state.speedRoundBests, entry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10) // Keep top 10
          return { speedRoundBests: newBests }
        })
      }
    }),
    {
      name: 'orbita-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ // Don't persist actions logic
        streak: state.streak,
        lastSession: state.lastSession,
        totalSessions: state.totalSessions,
        countryProgress: state.countryProgress,
        activityLog: state.activityLog,
        dailyActivity: state.dailyActivity || {},
        speedRoundBests: state.speedRoundBests || [],
        flagSessionsCompleted: state.flagSessionsCompleted || 0,
        challenges: state.challenges || { perfectContinents: {} }
      })
    }
  )
)
