import * as React from 'react'
import { ChevronDown } from 'lucide-react'

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
 * accessible and RTL-correct choice for a simple bounded option list, given
 * the same `.field-line` ledger treatment as Input/Textarea (globals.css →
 * Form fields). `appearance-none` strips the browser's own disclosure arrow
 * (which can't be restyled and reads as unthemed) in favor of our own
 * ChevronDown, positioned with logical properties so it mirrors correctly
 * under RTL.
 */
export const SelectField = React.forwardRef<
  HTMLSelectElement,
  SelectFieldProps
>(({ id, label, error, options, placeholder, className, ...props }, ref) => {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="field-label">
        {label}
      </Label>
      <div className="field-line" data-invalid={error ? true : undefined}>
        <select
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-9 w-full appearance-none bg-transparent px-0 py-1.5 pe-6 text-sm text-text-primary outline-none disabled:cursor-not-allowed disabled:text-text-disabled',
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
        <ChevronDown className="pointer-events-none absolute inset-y-0 end-0 my-auto size-4 text-text-muted" />
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
SelectField.displayName = 'SelectField'
