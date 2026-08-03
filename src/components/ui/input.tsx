import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The bare control only — no border, no background, no box. It sits inside a
 * `.field-box` wrapper (globals.css → Form fields), which owns the border,
 * radius and accent focus ring. Used bare it reads as unstyled text, by
 * design: keeping the box in exactly one place is what lets the wrapper hold
 * adornments (the password eye, the select chevron) inside the same border,
 * and what makes the density tokens apply to every field at once.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full min-w-0 flex-1 bg-transparent p-0 text-[15px] text-text-primary outline-none placeholder:text-text-disabled disabled:cursor-not-allowed disabled:text-text-disabled',
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
