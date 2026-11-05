// localStorage can throw (private mode, blocked site data, quota). UI flags are optional,
// so every access is guarded and falls back to "unset".
export function safeGet(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Not persisted; the app keeps working in memory.
  }
}
