import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TextFieldProps extends React.ComponentProps<'input'> {
  id: string
  label: string
  error?: string
}

/**
 * Label + Input + error, with the shared accessibility wiring (CONVENTIONS.md):
 * a real <Label>, `aria-invalid` and `aria-describedby` pointing at the error.
 * Cross-feature primitive — used by auth and leads forms alike. The
 * `.field-box` wrapper owns the border/radius/focus-ring (globals.css → Form
 * fields); Input itself stays bare.
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, label, error, className, ...props }, ref) => {
    const errorId = `${id}-error`
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="field-label">
          {label}
        </Label>
        <div className="field-box" data-invalid={error ? true : undefined}>
          <Input
            id={id}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={className}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>
    )
  }
)
TextField.displayName = 'TextField'
