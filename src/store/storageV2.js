import countries from '../data/countries.json'
import { migrateV0toV2, freshV2 } from '../srs/migrate.js'

// v2 persistence for the Zustand store.
// - Lives in its own key ('orbita-v2'), so a tab still running the old bundle
//   (which writes 'orbita-storage') can never overwrite it (DB-4).
// - Every write reads the disk and merges (mergeV2) before writing, so two tabs
//   never drop each other's answers (DB-1).
// - Never throws: blocked storage, quota and corrupt JSON degrade to in-memory.
// - Never writes or removes the legacy key.

export const MAX_LOG = 5000
export const MAX_DAYS = 400
export const MAX_CONFUSIONS = 5
export const MAX_SPEED_BESTS = 10

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const round2 = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : v)

// reviewLog entry: [cardId, rating, tsSec, sBefore, dBefore, latencyMs|null].
// sBefore/dBefore are rounded to 2 decimals to keep 5000 entries small.
export function toLogEntry(cardId, [rating, tsSec, sBefore, dBefore], latencyMs) {
  return [cardId, rating, tsSec, round2(sBefore), round2(dBefore), latencyMs ?? null]
}

const logKey = (e) => `${e[0]}|${e[2]}`

export function capLog(log) {
  return log.length > MAX_LOG ? log.slice(log.length - MAX_LOG) : log
}

export function capDaily(daily) {
  const days = Object.keys(daily)
  if (days.length <= MAX_DAYS) return daily
  const out = {}
  for (const d of days.sort().slice(-MAX_DAYS)) out[d] = daily[d]
  return out
}

// Keeps the MAX_CONFUSIONS highest counts. Ties keep the later key, so a
// just-recorded confusion can displace an old one with the same count.
export function capConfusionRow(row) {
  const entries = Object.entries(row)
  if (entries.length <= MAX_CONFUSIONS) return row
  return Object.fromEntries(
    entries
      .map((e, i) => [...e, i])
      .sort((a, b) => b[1] - a[1] || b[2] - a[2])
      .slice(0, MAX_CONFUSIONS)
      .sort((a, b) => a[2] - b[2])
      .map(([k, v]) => [k, v]),
  )
}

export function topSpeedBests(list) {
  const seen = new Set()
  const out = []
  for (const b of list) {
    if (!isObj(b)) continue
    const k = `${b.score}|${b.date}|${b.continent}|${b.fraction}|${b.qpm}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(b)
  }
  return out.sort((a, b) => num(b.score) - num(a.score)).slice(0, MAX_SPEED_BESTS)
}

function mergeCards(a, b) {
  const out = { ...a }
  for (const [id, card] of Object.entries(b)) {
    const prev = out[id]
    if (!isObj(prev)) {
      out[id] = card
      continue
    }
    if (!isObj(card)) continue
    const la = prev.last_review ?? -Infinity
    const lb = card.last_review ?? -Infinity
    if (lb > la || (lb === la && num(card.reps) >= num(prev.reps))) out[id] = card
  }
  return out
}

function mergeLog(a, b) {
  const byKey = new Map()
  for (const e of [...a, ...b]) if (Array.isArray(e)) byKey.set(logKey(e), e)
  const all = [...byKey.values()].sort(
    (x, y) => num(x[2]) - num(y[2]) || String(x[0]).localeCompare(String(y[0])),
  )
  return capLog(all)
}

function mergeDaily(a, b) {
  const out = {}
  for (const src of [a, b]) {
    for (const [day, v] of Object.entries(src)) {
      if (!isObj(v)) continue
      const p = out[day] || { reviews: 0, new: 0 }
      out[day] = { reviews: Math.max(p.reviews, num(v.reviews)), new: Math.max(p.new, num(v.new)) }
    }
  }
  return capDaily(out)
}

function mergeConfusions(a, b) {
  const out = {}
  for (const src of [a, b]) {
    for (const [id, row] of Object.entries(src)) {
      if (!isObj(row)) continue
      const p = (out[id] ||= {})
      for (const [iso, n] of Object.entries(row)) p[iso] = Math.max(num(p[iso]), num(n))
    }
  }
  for (const id of Object.keys(out)) out[id] = capConfusionRow(out[id])
  return out
}

// streak + lastSessionDay come from the side with the greater lastSessionDay.
// totalSessions and flagSessionsCompleted only grow, so they take the max.
function mergeStats(a, b) {
  const da = a.lastSessionDay || ''
  const db = b.lastSessionDay || ''
  const win = db > da ? b : a
  return {
    streak: num(win.streak),
    lastSessionDay: win.lastSessionDay ?? null,
    totalSessions: Math.max(num(a.totalSessions), num(b.totalSessions)),
    flagSessionsCompleted: Math.max(num(a.flagSessionsCompleted), num(b.flagSessionsCompleted)),
  }
}

function mergePerfect(a, b) {
  const out = {}
  for (const src of [a, b]) for (const [k, v] of Object.entries(src)) if (v === true) out[k] = true
  return out
}

const obj = (v) => (isObj(v) ? v : {})
const arr = (v) => (Array.isArray(v) ? v : [])

// disk + mem -> merged StateV2. Commutative for everything with a natural order;
// meta and settings (no timestamp) prefer disk, then mem.
export function mergeV2(disk, mem) {
  const d = obj(disk)
  const m = obj(mem)
  return {
    schema: 2,
    meta: { ...obj(m.meta), ...obj(d.meta) },
    cards: mergeCards(obj(d.cards), obj(m.cards)),
    reviewLog: mergeLog(arr(d.reviewLog), arr(m.reviewLog)),
    confusions: mergeConfusions(obj(d.confusions), obj(m.confusions)),
    daily: mergeDaily(obj(d.daily), obj(m.daily)),
    stats: mergeStats(obj(d.stats), obj(m.stats)),
    speedRoundBests: topSpeedBests([...arr(d.speedRoundBests), ...arr(m.speedRoundBests)]),
    challenges: {
      perfectContinents: mergePerfect(
        obj(obj(d.challenges).perfectContinents),
        obj(obj(m.challenges).perfectContinents),
      ),
    },
    settings: isObj(d.settings) ? d.settings : isObj(m.settings) ? m.settings : freshV2(0).settings,
  }
}

// Folds a migrated legacy snapshot into v2. Legacy cards only fill ids that v2
// does not have: the migration seeds last_review = now, so a stale v0 Conf would
// otherwise beat a real FSRS card. Everything else uses mergeV2 (max / OR / union).
export function absorbLegacy(v2, migrated) {
  const have = obj(v2.cards)
  const fill = {}
  for (const [id, card] of Object.entries(obj(migrated.cards))) if (!(id in have)) fill[id] = card
  const merged = mergeV2(v2, { ...migrated, cards: fill, meta: {}, settings: undefined })
  // An old-bundle tab must not reset the streak: v2 keeps streak and
  // lastSessionDay unless it never had a session. Counters still take the max.
  const vs = obj(v2.stats)
  if (vs.lastSessionDay != null) {
    merged.stats = { ...merged.stats, streak: num(vs.streak), lastSessionDay: vs.lastSessionDay }
  }
  return merged
}

// Cheap stable string hash (djb2) to remember which legacy snapshot was absorbed.
export function hashString(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return `${s.length}:${(h >>> 0).toString(36)}`
}

function isQuota(e) {
  return (
    !!e &&
    (e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e.code === 22 ||
      e.code === 1014)
  )
}

function getLocalStorage() {
  try {
    const ls = window.localStorage
    return ls || null
  } catch {
    return null
  }
}

const tooNew = (p) => num(p.version) > 2 || (isObj(p.state) && num(p.state.schema) > 2)

// status: 'ok' | 'unavailable' | 'legacy-error' | 'corrupt' | 'quota-error' | 'needsReload'
// Every status except 'ok' and 'quota-error' stops all writes until reload.
export function createV2Storage({
  legacyKey = 'orbita-storage',
  key = 'orbita-v2',
  backupKey = 'orbita-storage-backup-v1',
  validIds = new Set(countries.map((c) => c.id)),
  now = () => Date.now(),
} = {}) {
  let status = 'ok'
  let listener = null
  let muted = 0
  const writable = () => status === 'ok' || status === 'quota-error'

  const setStatus = (s) => {
    if (s === status) return
    status = s
    if (listener) {
      muted++
      try {
        listener(s)
      } finally {
        muted--
      }
    }
  }

  // Copies an unparsable value aside (once per distinct content). Returns true when
  // the copy exists, so the caller may carry on. If the copy fails, all writes stop.
  function quarantine(ls, srcKey, raw) {
    try {
      const prefix = `${srcKey}-corrupt-`
      const already = Object.keys(ls).some((k) => k.startsWith(prefix) && ls.getItem(k) === raw)
      if (!already) ls.setItem(`${prefix}${now()}`, raw)
      return true
    } catch {
      setStatus('corrupt')
      return false
    }
  }

  function write(ls, state) {
    try {
      ls.setItem(key, JSON.stringify({ state, version: 2 }))
      if (status === 'quota-error') setStatus('ok')
      return true
    } catch (e) {
      if (!isQuota(e)) {
        setStatus('unavailable')
        return false
      }
    }
    const log = arr(state.reviewLog)
    const halved = { ...state, reviewLog: log.slice(log.length - Math.floor(log.length / 2)) }
    try {
      ls.setItem(key, JSON.stringify({ state: halved, version: 2 }))
      return true
    } catch (e) {
      setStatus(isQuota(e) ? 'quota-error' : 'unavailable')
      return false
    }
  }

  // Parses legacy raw and migrates it. Returns null (and never writes) on failure.
  function migrateLegacy(raw) {
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { error: 'corrupt' }
    }
    try {
      return { state: migrateV0toV2(parsed, now(), validIds) }
    } catch {
      return { error: 'legacy-error' }
    }
  }

  // v2 exists: fold in legacy content written by an old-bundle tab, once per snapshot.
  function absorbFromDisk(ls, v2) {
    const raw = ls.getItem(legacyKey)
    if (raw == null) return v2
    const h = hashString(raw)
    if (obj(v2.meta).legacyHash === h) return v2
    const res = migrateLegacy(raw)
    if (!res.state) return v2 // ignore a bad legacy write; v2 stays as is
    const merged = absorbLegacy(v2, res.state)
    merged.meta = { ...merged.meta, legacyHash: h }
    write(ls, merged)
    return merged
  }

  function readV2(ls) {
    const raw = ls.getItem(key)
    if (raw == null) return { missing: true }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }
    if (!isObj(parsed) || !isObj(parsed.state)) {
      // Copied aside: treat v2 as missing (re-migrate from legacy or start fresh).
      return quarantine(ls, key, raw) ? { missing: true } : { error: true }
    }
    if (tooNew(parsed)) {
      setStatus('needsReload')
      return { error: true }
    }
    return { state: parsed.state }
  }

  function migrateFromLegacy(ls) {
    const raw = ls.getItem(legacyKey)
    if (raw == null) return null // new user: first action writes v2
    const res = migrateLegacy(raw)
    if (res.error === 'corrupt') {
      // Copied aside: start as a new user (the legacy key itself is never touched).
      quarantine(ls, legacyKey, raw)
      return null
    }
    if (res.error) {
      setStatus('legacy-error')
      return null
    }
    const state = { ...res.state, meta: { ...res.state.meta, legacyHash: hashString(raw) } }
    if (ls.getItem(backupKey) == null) {
      try {
        ls.setItem(backupKey, raw)
      } catch {
        // Without a backup we do not migrate on disk: keep the data in memory only.
        setStatus('legacy-error')
        return { state, version: 2 }
      }
    }
    write(ls, state)
    return { state, version: 2 }
  }

  return {
    get status() {
      return status
    },
    onStatus(fn) {
      listener = fn
    },

    getItem() {
      if (!writable()) return null
      const ls = getLocalStorage()
      if (!ls) {
        setStatus('unavailable')
        return null
      }
      try {
        const r = readV2(ls)
        if (r.error) return null
        if (r.missing) return migrateFromLegacy(ls)
        return { state: absorbFromDisk(ls, r.state), version: 2 }
      } catch {
        setStatus('unavailable')
        return null
      }
    },

    setItem(_name, value) {
      if (muted || !writable()) return
      const ls = getLocalStorage()
      if (!ls) {
        setStatus('unavailable')
        return
      }
      try {
        const r = readV2(ls)
        if (r.error) return
        write(ls, r.missing ? value.state : mergeV2(r.state, value.state))
      } catch {
        setStatus('unavailable')
      }
    },

    // Only the v2 key, and only when asked explicitly (persist.clearStorage).
    removeItem() {
      try {
        getLocalStorage()?.removeItem(key)
      } catch {
        // ignore
      }
    },

    // 'storage' event on the legacy key: migrate the new legacy content and fold it in.
    absorbLegacyWrite() {
      if (!writable()) return
      const ls = getLocalStorage()
      if (!ls) return
      try {
        const r = readV2(ls)
        if (r.state) absorbFromDisk(ls, r.state)
      } catch {
        setStatus('unavailable')
      }
    },
  }
}
