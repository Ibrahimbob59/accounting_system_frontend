import * as React from 'react'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
    <div className="space-y-2">
      <Label htmlFor={id} className="field-label">
        {label}
      </Label>
      <div className="field-box items-stretch" data-invalid={error ? true : undefined}>
        <Textarea
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
})
TextareaField.displayName = 'TextareaField'
