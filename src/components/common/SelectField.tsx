import * as React from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends React.ComponentProps<'select'> {
  id: string
  label: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

/**
 * Label + native <select> + error. A native select is the pragmatic, fully
 * accessible and RTL-correct choice for a simple bounded option list; styled to
 * match Input via tokens.
 */
export const SelectField = React.forwardRef<
  HTMLSelectElement,
  SelectFieldProps
>(({ id, label, error, options, placeholder, className, ...props }, ref) => {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-danger focus-visible:ring-danger',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
SelectField.displayName = 'SelectField'
