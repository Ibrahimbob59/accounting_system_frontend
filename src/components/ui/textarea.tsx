import * as React from 'react'

import { cn } from '@/lib/utils'

/** Bare control only — see input.tsx's header comment; meant for `.field-box`. */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-20 w-full flex-1 resize-y bg-transparent p-0 text-[15px] text-text-primary outline-none placeholder:text-text-disabled disabled:cursor-not-allowed disabled:text-text-disabled',
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
