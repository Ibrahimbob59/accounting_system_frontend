import * as React from 'react'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface RadioOption {
  value: string
  label: string
}

interface RadioGroupFieldProps
  extends Omit<React.ComponentProps<typeof RadioGroup>, 'name'> {
  /** Used to prefix each option's id (`${name}-${value}`) and the error id. */
  name: string
  label: string
  error?: string
  options: RadioOption[]
}

/**
 * Label + RadioGroup (one RadioGroupItem per option, each with its own
 * <Label>) + error. Integrates with react-hook-form via `Controller`
 * (value={field.value}, onValueChange={field.onChange}) — Radix's
 * RadioGroup has no native `onChange`/ref shape for `{...register()}`.
 */
export function RadioGroupField({
  name,
  label,
  error,
  options,
  className,
  ...props
}: RadioGroupFieldProps) {
  const errorId = `${name}-error`
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <RadioGroup
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(className)}
        {...props}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`
          return (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={id}
                className={cn(error && 'border-danger')}
              />
              <Label htmlFor={id} className="cursor-pointer font-normal">
                {option.label}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
