import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PasswordFieldProps extends Omit<
  React.ComponentProps<'input'>,
  'type'
> {
  id: string
  label: string
  error?: string
  showLabel: string
  hideLabel: string
}

/** Password input with a show/hide toggle, same a11y wiring as TextField. */
export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(({ id, label, error, showLabel, hideLabel, className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false)
  const errorId = `${id}-error`

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          ref={ref}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'pe-10',
            error && 'border-danger focus-visible:ring-danger',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-text-muted hover:text-text-secondary"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
PasswordField.displayName = 'PasswordField'
