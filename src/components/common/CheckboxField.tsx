import * as React from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CheckboxFieldProps
  extends Omit<React.ComponentProps<typeof Checkbox>, 'id'> {
  id: string
  label: string
  error?: string
}

/**
 * Label + Checkbox + error, same a11y wiring as TextField. Not a native
 * input — Radix's Checkbox is a button with role="checkbox", so
 * react-hook-form integration goes through `Controller`
 * (checked={field.value}, onCheckedChange={field.onChange}), not
 * `{...register()}` like TextField/SelectField.
 */
export const CheckboxField = React.forwardRef<
  React.ComponentRef<typeof Checkbox>,
  CheckboxFieldProps
>(({ id, label, error, className, ...props }, ref) => {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(error && 'border-danger', className)}
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
CheckboxField.displayName = 'CheckboxField'
