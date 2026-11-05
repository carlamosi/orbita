import { Rating, State } from './scheduler.js'

// [fast, slow] latency thresholds in ms.
const THRESHOLDS = {
  choice: [2500, 8000],
  typed: [5000, 15000],
  globe: [4000, 12000],
}

export function toRating({ correct, latencyMs, hintUsed, inputKind, timed, state }) {
  if (!correct) return Rating.Again
  if (timed) return Rating.Good
  if (hintUsed) return Rating.Hard
  if (latencyMs == null) return Rating.Good
  const [fast, slow] = THRESHOLDS[inputKind] || THRESHOLDS.choice
  if (latencyMs > slow) return Rating.Hard
  if (latencyMs < fast && state !== State.New && state !== State.Learning) return Rating.Easy
  return Rating.Good
}
