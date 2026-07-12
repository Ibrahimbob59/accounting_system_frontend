import * as React from 'react'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface TextareaFieldProps extends React.ComponentProps<'textarea'> {
  id: string
  label: string
  error?: string
}

/** Label + Textarea + error, same a11y wiring as TextField. */
export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(({ id, label, error, className, ...props }, ref) => {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          error && 'border-danger focus-visible:ring-danger',
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
TextareaField.displayName = 'TextareaField'
