// Local calendar day key ('YYYY-MM-DD') for a timestamp, in a given IANA time zone.
// When timeZone is omitted, the device zone is used.
export function localDayKey(nowMs, timeZone) {
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(nowMs)
}

// Whole calendar days from keyA to keyB (keyB - keyA). Both are 'YYYY-MM-DD'.
// Computed in UTC on midnight-UTC dates, so DST shifts never affect the result.
export function daysBetween(keyA, keyB) {
  const a = Date.parse(`${keyA}T00:00:00Z`)
  const b = Date.parse(`${keyB}T00:00:00Z`)
  return Math.round((b - a) / 86400000)
}
