import { useEffect, useState } from 'react'

/**
 * Debounces a rapidly-changing value — typically a search box feeding a query
 * param, so typing doesn't fire a request per keystroke.
 *
 * Shared rather than feature-local: it started inside the partners feature with
 * a note to promote it "once a second list search needs the same debounce",
 * which the accounts list made true. Cross-feature imports of another feature's
 * `hooks/` are forbidden (docs/CONVENTIONS.md → Forbidden patterns), so genuinely
 * shared hooks live here.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
