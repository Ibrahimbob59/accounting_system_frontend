import * as React from 'react'

import { cn } from '@/lib/utils'

/** Bare control only — see input.tsx's header comment; meant for `.field-line`. */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full resize-y bg-transparent px-0 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-disabled disabled:cursor-not-allowed disabled:text-text-disabled',
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
