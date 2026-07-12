import * as React from 'react'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface SwitchFieldProps
  extends Omit<React.ComponentProps<typeof Switch>, 'id'> {
  id: string
  label: string
  error?: string
}

/**
 * Label + Switch + error, same a11y wiring as TextField. Like
 * CheckboxField, integrate with react-hook-form via `Controller`
 * (checked={field.value}, onCheckedChange={field.onChange}), not
 * `{...register()}`.
 */
export const SwitchField = React.forwardRef<
  React.ComponentRef<typeof Switch>,
  SwitchFieldProps
>(({ id, label, error, className, ...props }, ref) => {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={className}
          {...props}
        />
        <Label htmlFor={id} className="cursor-pointer font-normal">
          {label}
        </Label>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
SwitchField.displayName = 'SwitchField'
