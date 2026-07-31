import { useEffect, useState } from 'react'

/** Feeds the partners list search box's `q` param without firing a request
 * per keystroke. Feature-local for now — promote to a shared hook once a
 * second list search needs the same debounce. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
