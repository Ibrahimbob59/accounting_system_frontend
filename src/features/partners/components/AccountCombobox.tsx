import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
}

interface AccountComboboxProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  clearLabel?: string
  isLoading?: boolean
  error?: string
}

/**
 * Read-only searchable combobox — built for the §3.5 AR/AP account-override
 * picker (no real Chart of Accounts screen exists yet), but deliberately
 * generic (plain `{value, label}` options, no Account-shaped props) so it's
 * promotable to components/common once a second feature needs it, per
 * CONVENTIONS.md ("a component only belongs there once a second feature
 * needs it"). Not a full accounts management UI — just a picker.
 */
export function AccountCombobox({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  clearLabel,
  isLoading,
  error,
}: AccountComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const errorId = `${id}-error`

  const selected = options.find((o) => o.value === value)
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="field-label">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 text-start text-sm text-text-primary outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              !selected && 'text-text-muted'
            )}
          >
            <span className="truncate">{selected?.label ?? placeholder}</span>
            {isLoading ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-text-muted" />
            ) : (
              <ChevronsUpDown className="size-4 shrink-0 text-text-muted" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <div className="border-b border-border p-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-text-muted hover:bg-surface-secondary"
              >
                <X className="size-3.5" />
                {clearLabel}
              </button>
            )}
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-center text-sm text-text-muted">
                {emptyText}
              </p>
            )}
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                  setQuery('')
                }}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-start text-sm text-text-primary hover:bg-surface-secondary"
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="size-3.5 shrink-0 text-primary-700" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
