import { fsrs, generatorParameters, createEmptyCard, Rating, State } from 'ts-fsrs'

export { Rating, State }

// One scheduler per fuzz setting, built lazily.
const schedulers = {}

function getScheduler(fuzz) {
  const key = fuzz ? 'fuzz' : 'nofuzz'
  if (!schedulers[key]) {
    schedulers[key] = fsrs(
      generatorParameters({
        request_retention: 0.9,
        maximum_interval: 365,
        enable_short_term: true,
        learning_steps: ['1m', '10m'],
        relearning_steps: ['10m'],
        enable_fuzz: fuzz,
      }),
    )
  }
  return schedulers[key]
}

// Card <-> ts-fsrs card. Stored cards use epoch ms numbers only.
function toLib(card) {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: 0, // deprecated in ts-fsrs, derived from last_review
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review == null ? undefined : new Date(card.last_review),
  }
}

function fromLib(c) {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? c.last_review.getTime() : null,
  }
}

export function newCard(nowMs) {
  return fromLib(createEmptyCard(new Date(nowMs)))
}

export function reviewCard(card, rating, nowMs, { fuzz = true } = {}) {
  const res = getScheduler(fuzz).next(toLib(card), new Date(nowMs), rating)
  return {
    card: fromLib(res.card),
    log: [rating, Math.floor(nowMs / 1000), card.stability, card.difficulty],
  }
}

export function retrievability(card, nowMs) {
  if (card.state === State.New) return 0
  return getScheduler(false).get_retrievability(toLib(card), new Date(nowMs), false)
}
