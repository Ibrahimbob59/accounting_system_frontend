import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Handoff §5 — Buttons. Three real variants (primary / outline / danger);
 * `ghost` and `link` exist for chrome affordances (icon buttons in the top
 * bar, inline text links) that the handoff doesn't treat as buttons.
 *
 * Flat fills only: no gradients, and no shadow on hover — hover darkens the
 * fill instead. `destructive` is an OUTLINE variant, not a filled red button;
 * the handoff never uses a solid red, so a destructive action reads as a quiet
 * outline until you hover it.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans font-semibold transition-colors disabled:pointer-events-none disabled:opacity-85 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white hover:bg-brand-hover',
        outline:
          'border border-border bg-surface font-medium text-text-secondary hover:bg-surface-secondary',
        destructive:
          'border border-danger-border bg-surface font-medium text-danger hover:bg-danger-soft',
        secondary:
          'bg-surface-secondary text-text-primary hover:bg-surface-secondary/70',
        ghost: 'font-medium text-text-secondary hover:bg-surface-secondary',
        link: 'font-medium text-brand underline-offset-4 hover:text-brand-hover hover:underline',
      },
      size: {
        default: 'px-4 py-2.5 text-sm',
        sm: 'px-3 py-1.5 text-[13px]',
        /* Form submits and landing CTAs. Width is deliberately NOT baked in —
           add `w-full` at the call site where the button should fill its
           column, so this size stays usable in an inline CTA row too. */
        lg: 'px-5 py-3 text-[15px]',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
