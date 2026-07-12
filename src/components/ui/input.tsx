import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The bare control only — no border, no background, no box. It's meant to
 * sit inside a `.field-line` wrapper (globals.css), which owns the visual
 * rule; used bare it just reads as unstyled text, by design (docs/
 * CONVENTIONS.md → Style scoping).
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full min-w-0 bg-transparent px-0 py-1.5 text-sm text-text-primary tabular-nums outline-none placeholder:text-text-disabled disabled:cursor-not-allowed disabled:text-text-disabled',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
