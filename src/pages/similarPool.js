// Pool for the Similar Flags challenge: countries that are the source or target of a
// `similarTo` link, or that appear as a card key or chosen answer in the flag-card
// confusions. Falls back to the whole set when fewer than 4 countries qualify
// (a question needs 4 options).
export function similarPool(countries, confusions) {
  if (!countries) return []
  const ids = new Set()
  for (const c of countries) {
    if (c.similarTo) {
      ids.add(c.id)
      ids.add(c.similarTo)
    }
  }
  for (const [cardId, row] of Object.entries(confusions || {})) {
    if (!cardId.endsWith(':flag')) continue
    ids.add(cardId.slice(0, -':flag'.length))
    for (const chosen of Object.keys(row || {})) ids.add(chosen)
  }
  const pool = countries.filter((c) => ids.has(c.id))
  return pool.length < 4 ? countries : pool
}
