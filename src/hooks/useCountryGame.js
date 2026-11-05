import { useState, useEffect, useMemo, useRef } from 'react'
import { useWorldData } from '../context/WorldDataContext'
import { useGameStore } from '../store/useGameStore'
import { useSounds } from './useSounds'
import { buildSession } from '../srs/selector.js'
import { toRating } from '../srs/rating.js'
import { State, retrievability } from '../srs/scheduler.js'
import datasetCountries from '../data/countries.json'

// Card category each mode tests.
const CATEGORY = { find: 'loc', name: 'loc', flag: 'flag', capital: 'cap' }
// Default input kind per mode (pages override per answer when a mode mixes inputs).
const INPUT_KIND = { find: 'globe', name: 'choice', flag: 'choice', capital: 'typed' }
// Modes asked on the globe need a GeoJSON shape for the country.
const NEEDS_SHAPE = new Set(['find', 'name'])
const PRACTICE_SIZE = 20
const PRACTICE_MIN = 5

const VALID_IDS = new Set(datasetCountries.map((c) => c.id))
const featureId = (f) => f.id || f.properties?.iso_a3 || f.properties?.ISO_A3

// Free practice (today's session is empty). Draws from cards already seen in this
// category, lowest retrievability first, so it never spends the daily new-card quota.
// Only when fewer than PRACTICE_MIN seen cards exist it tops up with random unseen
// countries up to PRACTICE_MIN. Answers are still rated.
function practiceSession(cards, pool, cat, nowMs, rng) {
  const unique = [...new Map(pool.map((c) => [c.id, c])).values()]
  const seen = []
  const unseen = []
  for (const c of unique) {
    const card = cards?.[`${c.id}:${cat}`]
    if (card && card.state !== State.New) seen.push({ c, r: retrievability(card, nowMs) })
    else unseen.push({ c, r: rng() })
  }
  seen.sort((a, b) => a.r - b.r)
  const picked = seen.slice(0, PRACTICE_SIZE)
  if (picked.length < PRACTICE_MIN) {
    unseen.sort((a, b) => a.r - b.r)
    picked.push(...unseen.slice(0, PRACTICE_MIN - picked.length))
  }
  // No two consecutive questions about the same country.
  const out = []
  const queue = picked.map(({ c }) => c.id)
  while (queue.length > 0) {
    const last = out.length ? out[out.length - 1].iso3 : null
    const i = queue.findIndex((id) => id !== last)
    if (i === -1) break
    const [iso3] = queue.splice(i, 1)
    out.push({ cardId: `${iso3}:${cat}`, iso3, isNew: false, practice: true })
  }
  return out
}

export function useCountryGame(mode = 'find', { pool: customPool = null, now = Date.now, rng = Math.random } = {}) {
  const { countries, geoData } = useWorldData()
  const answer = useGameStore((s) => s.answer)
  const recordConfusion = useGameStore((s) => s.recordConfusion)
  const finishSession = useGameStore((s) => s.finishSession)
  const incrementFlagSessions = useGameStore((s) => s.incrementFlagSessions)
  const { playCorrect, playWrong, playStreak, playComplete } = useSounds()

  const cat = CATEGORY[mode] || 'loc'
  const needsShape = NEEDS_SHAPE.has(mode)

  // Pool the session draws from: custom pool or all countries, minus countries the
  // globe cannot show in globe modes.
  const pool = useMemo(() => {
    const base = customPool && customPool.length > 0 ? customPool : countries
    if (!base) return null
    if (!needsShape) return base
    if (!geoData) return null
    const shapes = new Set(geoData.features.map(featureId))
    return base.filter((c) => shapes.has(c.id))
  }, [customPool, countries, geoData, needsShape])
  const poolKey = pool ? pool.map((c) => c.id).join(',') : null

  const [session, setSession] = useState(null)
  const [isPractice, setIsPractice] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [currentCountry, setCurrentCountry] = useState(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  // Mutable game cursor, read from handlers that pages call inside setTimeout closures.
  const game = useRef({ session: null, country: null, index: 0, score: 0, combo: 0, answered: true, done: false, finished: false })
  const question = useRef({ shownAt: 0, hidden: false })

  const nowRef = useRef(now)
  nowRef.current = now
  const rngRef = useRef(rng)
  rngRef.current = rng

  const byId = useMemo(() => new Map((pool || []).map((c) => [c.id, c])), [pool])

  const showQuestion = (s, index) => {
    const country = byId.get(s[index].iso3) || null
    game.current.country = country
    game.current.index = index + 1
    game.current.answered = false
    question.current = { shownAt: nowRef.current(), hidden: typeof document !== 'undefined' && document.hidden }
    setCurrentCountry(country)
    setQuestionCount(index + 1)
  }

  const start = (s, practice) => {
    game.current = { session: s, country: null, index: 0, score: 0, combo: 0, answered: true, done: false, finished: false }
    setSession(s)
    setIsPractice(practice)
    setScore(0)
    setCombo(0)
    setIsFinished(false)
    setCurrentCountry(null)
    setQuestionCount(0)
    if (s.length > 0) showQuestion(s, 0)
  }

  const startDue = () => {
    if (!pool) return
    // buildSession falls back to every country on an empty pool; an empty pool has no questions.
    const s = pool.length === 0 ? [] : buildSession(useGameStore.getState(), {
      nowMs: nowRef.current(),
      cat,
      pool,
      rng: rngRef.current,
    })
    start(s, false)
  }

  // Build the session once the pool is ready (and again if the pool itself changes).
  useEffect(() => {
    if (poolKey === null) return
    startDue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey, cat])

  // A question answered after the tab was hidden has no meaningful latency.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = () => {
      if (document.hidden) question.current.hidden = true
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const nextQuestion = () => {
    const g = game.current
    if (!g.session || g.finished) return
    if (g.index >= g.session.length) {
      g.finished = true
      setIsFinished(true)
      playComplete()
      return
    }
    showQuestion(g.session, g.index)
  }

  const handleAnswer = (isCorrect, answerId = null, { hintUsed = false, inputKind } = {}) => {
    const g = game.current
    const asked = g.country
    if (!g.session || g.answered || !asked) return
    g.answered = true

    const nowMs = nowRef.current()
    const cardId = `${asked.id}:${cat}`
    const latencyMs = question.current.hidden ? null : Math.max(0, nowMs - question.current.shownAt)
    const rating = toRating({
      correct: isCorrect,
      latencyMs,
      hintUsed,
      inputKind: inputKind || INPUT_KIND[mode] || 'choice',
      timed: false,
      state: useGameStore.getState().cards[cardId]?.state,
    })
    answer(cardId, rating, nowMs, { latencyMs })

    if (isCorrect) {
      g.score += 10 + g.combo * 2 // bonus points for combo
      g.combo += 1
      if (g.combo >= 3) playStreak()
      else playCorrect()
    } else {
      g.combo = 0
      playWrong()
      // The clicked country was not asked: never rate it, only remember the mix-up.
      if (answerId && answerId !== asked.id && VALID_IDS.has(answerId)) {
        recordConfusion(cardId, answerId)
      }
    }
    setScore(g.score)
    setCombo(g.combo)

    // Last question: close the session here, with the score this answer produced (BUG-03).
    if (g.index >= g.session.length && !g.done) {
      g.done = true
      finishSession(mode, g.score, nowMs)
      if (mode === 'flag') incrementFlagSessions()
    }
  }

  const restartGame = () => startDue()

  const startPractice = () => {
    if (!pool || pool.length === 0) return
    start(practiceSession(useGameStore.getState().cards, pool, cat, nowRef.current(), rngRef.current), true)
  }

  return {
    currentCountry,
    score,
    combo,
    questionCount,
    maxQuestions: session ? session.length : 0,
    isFinished,
    sessionEmpty: session !== null && session.length === 0,
    isPractice,
    nextQuestion,
    handleAnswer,
    restartGame,
    startPractice,
  }
}
