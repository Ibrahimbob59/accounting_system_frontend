import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TextFieldProps extends React.ComponentProps<'input'> {
  id: string
  label: string
  error?: string
}

/**
 * Label + Input + error, with the shared accessibility wiring (CONVENTIONS.md):
 * a real <Label>, `aria-invalid` and `aria-describedby` pointing at the error.
 * Cross-feature primitive — used by auth and leads forms alike.
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, label, error, className, ...props }, ref) => {
    const errorId = `${id}-error`
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
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
  }
)
TextField.displayName = 'TextField'
