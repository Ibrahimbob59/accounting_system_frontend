import Swal from 'sweetalert2'

/**
 * Thin wrapper over SweetAlert2 (same library used in this team's other
 * project). SweetAlert2 ships its own CSS, not our tokens — the
 * `customClass` hooks below point its popup/button classes at our own
 * Tailwind utilities so it reads as part of this app rather than a
 * bolted-on library, but this is a deliberately shallower integration than
 * a component built on our tokens from scratch (that tradeoff — familiar
 * API now vs. full theme integration — was chosen explicitly; see
 * docs/CONVENTIONS.md).
 *
 * SweetAlert2's own default z-index comfortably clears our Dialog's (Radix
 * default z-50 vs. SweetAlert2's ~1060), so confirm()/alert() opened from
 * within an already-open Modal should layer correctly without extra work —
 * but re-check this if that combination is ever actually used, the same
 * way the other project needed an explicit `.swal2-container` z-index
 * override once SweetAlert2 started opening on top of Bootstrap modals.
 */
const themedSwal = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup: 'rounded-lg bg-surface font-sans shadow-lg',
    title: 'font-display font-bold text-text-primary',
    htmlContainer: 'text-text-secondary',
    /* Mirrors Button's `default` and `outline` variants (components/ui/
       button.tsx) — flat accent fill, darkened on hover, no shadow. */
    confirmButton:
      'mx-1 inline-flex items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover',
    cancelButton:
      'mx-1 inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-secondary',
  },
})

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** 'danger' just swaps the icon to a warning triangle — the confirm
   * button intentionally stays the same accent action color in both cases,
   * to avoid SweetAlert2 shallow-merging a partial customClass override
   * and dropping the rest of the mixin's classes (fire()'s customClass
   * replaces the mixin's object wholesale, it doesn't deep-merge). */
  variant?: 'default' | 'danger'
}

/** Confirm dialog — resolves true if confirmed, false if cancelled/dismissed. */
export async function confirm({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmOptions): Promise<boolean> {
  const result = await themedSwal.fire({
    title,
    text: description,
    icon: variant === 'danger' ? 'warning' : undefined,
    showCancelButton: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: cancelLabel,
    reverseButtons: true,
  })
  return result.isConfirmed
}

/** One-button informational alert. */
export async function alert(title: string, description?: string): Promise<void> {
  await themedSwal.fire({ title, text: description, confirmButtonText: 'OK' })
}

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

/** Auto-dismissing corner toast. */
export function toast(variant: ToastVariant, message: string): void {
  void themedSwal.fire({
    toast: true,
    position: 'bottom-end',
    icon: variant,
    title: message,
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
  })
}
