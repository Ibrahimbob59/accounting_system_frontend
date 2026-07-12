import type { ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  footer?: ReactNode
  children?: ReactNode
}

/**
 * Themed wrapper around shadcn's Dialog (components/ui/dialog.tsx, vendor
 * code) — the one place modal-wide conventions (title in the display font,
 * title/description/footer slots) live, so screens compose a Modal instead
 * of remembering Radix's Dialog primitives every time.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
