/**
 * Permission gating for the UI.
 *
 * TODO(D-003): every call returns `true` — see docs/DEFERRED.md → D-003.
 * `GET /auth/me` doesn't report the caller's permissions yet, so the frontend
 * genuinely cannot know what the current user may do. (`GET /permissions`
 * lists every permission that *exists*, not the ones you hold.)
 *
 * The check is centralized here, rather than each screen inlining its own
 * condition, so finishing this is a one-file change: once `MeResponseDto`
 * carries `permissions: string[]`, store it on the auth store and have this
 * read from there — every gate in the app updates at once, with no audit of
 * individual buttons.
 *
 * This is a UI affordance, never a security boundary. The server enforces
 * permissions regardless of what we render, and denied actions surface a
 * specific message via `isPermissionDenied()` below. That handling is
 * permanent and stays after this TODO is resolved.
 */

/** A permission key in the backend's `subject.action` form, e.g. `user.create`.
 * Keys are added as screens start gating on them, so the union stays a real
 * inventory of what the UI checks rather than a copy of the whole catalogue. */
export type PermissionKey =
  | 'user.create'
  | 'user.read'
  | 'user.update'
  | 'user.delete'
  | 'account.create'
  | 'account.read'
  | 'account.update'
  | 'account.delete'
  | 'journalentry.create'
  | 'journalentry.read'
  | 'journalentry.update'
  | 'journalentry.delete'
  | 'journalentry.post'
  | 'journalentry.reverse'
  | 'item.create'
  | 'item.read'
  | 'item.update'
  | 'item.delete'
  | 'company.create'
  | 'company.read'
  | 'company.update'
  | 'company.delete'

export function usePermission(key: PermissionKey): boolean {
  // `key` is intentionally ignored until the backend reports permissions; it's
  // part of the signature now so call sites never have to change later.
  void key
  return true
}

/**
 * The stable code the backend's PermissionsGuard throws
 * (`src/modules/casl/guards/permissions.guard.ts`). Branching on the code
 * rather than the HTTP status keeps this aligned with how every other error is
 * handled in this repo (docs/API-CONTRACTS.md → Adding a new endpoint).
 */
export const PERMISSION_DENIED = 'PERMISSION_DENIED'

/** True when an unknown error is the backend refusing on permissions. */
export function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === PERMISSION_DENIED
  )
}
