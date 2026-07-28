import { useCallback, useState } from 'react'

/**
 * useState mirrored into localStorage. Used for small, genuinely local UI
 * preferences (sidebar collapsed) that should survive a reload but aren't
 * cross-cutting enough to earn a Zustand store — per CONVENTIONS.md, there's
 * exactly one global store (auth) and this isn't a second.
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  const set = useCallback(
    (value: T) => {
      setState(value)
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Ignore write failures (private mode, quota) — in-memory state still updates.
      }
    },
    [key]
  )

  return [state, set]
}
