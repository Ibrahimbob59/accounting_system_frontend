import { z } from 'zod'
import type { TFunction } from 'i18next'

import type { PaginationMeta } from '@/types/api'

// -----------------------------------------------------------------------------
// Domain types — confirmed against the backend's users/roles/permissions
// controllers and DTOs, not inferred from sample payloads.
// -----------------------------------------------------------------------------

export type Language = 'EN' | 'FR' | 'AR'

/** Backend `PermissionResponseDto`. `key` is the `subject.action` form. */
export interface Permission {
  id: string
  key: string
  subject: string
  action: string
  description: string
}

/** Backend `RoleResponseDto`. `companyId: null` + `isSystem` = a built-in role
 * (Company Admin / Company Member), which must not be presented as editable. */
export interface Role {
  id: string
  name: string
  description: string | null
  companyId: string | null
  isSystem: boolean
  /** Permission keys, already flattened by the backend. */
  permissions: string[]
  createdAt: string
  updatedAt: string
}

/**
 * Backend `UserResponseDto`.
 *
 * TODO(D-001): `roles` is NOT returned by the API today — see
 * docs/DEFERRED.md → D-001. It's declared optional here on purpose rather
 * than omitted: the list already renders it when present, so the Role column
 * fills in by itself the day the backend includes it, with no change here.
 * Everything reading this must treat it as possibly-absent, and must never
 * render "no roles" from its absence — absent means unknown, not empty.
 */
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  preferredLanguage: Language
  isActive: boolean
  lastLoginAt: string | null
  isPlatformAdmin: boolean
  createdAt: string
  updatedAt: string
  roles?: Role[]
}

/** `PaginationQueryDto` — the backend exposes no search or filter params on
 * `GET /users`, so this is the whole query surface. */
export interface ListUsersQuery {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UsersPage {
  data: User[]
  meta: PaginationMeta | null
}

/** `UpdateUserDto` = PartialType(OmitType(CreateUserDto, ['password'])).
 * `roleIds` is deliberately not exposed — see docs/DEFERRED.md → D-002. */
export interface UpdateUserDto {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  preferredLanguage?: Language
  isActive?: boolean
}

// -----------------------------------------------------------------------------
// Invitations — backend `CreateInvitationDto` / `InvitationResponseDto`.
// -----------------------------------------------------------------------------

export type InvitationDuration =
  | 'ONE_DAY'
  | 'THREE_DAYS'
  | 'ONE_WEEK'
  | 'TWO_WEEKS'
  | 'THIRTY_DAYS'

/** From `GET /invitations/durations` — fetched rather than hardcoded so the
 * options can't drift from the backend enum. */
export interface InvitationDurationOption {
  value: InvitationDuration
  label: string
  days: number
}

export interface Invitation {
  id: string
  companyId: string
  email: string
  firstName: string
  lastName: string
  /** Unlike User.roles, this IS returned — so invitations can show their roles. */
  roleIds: string[]
  accepted: boolean
  duration: InvitationDuration
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

export interface CreateInvitationDto {
  email: string
  firstName?: string
  lastName?: string
  roleIds: string[]
  duration: InvitationDuration
}

// -----------------------------------------------------------------------------
// Form schemas
// -----------------------------------------------------------------------------

/** Invite form. `roleIds` is required and non-empty because it's the only
 * chance to assign roles — they can't be changed afterwards (D-002). */
export function makeInviteSchema(t: TFunction<'users'>) {
  return z.object({
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.emailInvalid')),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roleIds: z.array(z.string()).min(1, t('validation.roleRequired')),
    duration: z.string().min(1, t('validation.required')),
  })
}

export type InviteFormValues = z.infer<ReturnType<typeof makeInviteSchema>>

export function makeUserEditSchema(t: TFunction<'users'>) {
  return z.object({
    firstName: z.string().min(1, t('validation.required')),
    lastName: z.string().min(1, t('validation.required')),
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.emailInvalid')),
    phone: z.string().optional(),
    preferredLanguage: z.enum(['EN', 'FR', 'AR']),
  })
}

export type UserEditFormValues = z.infer<ReturnType<typeof makeUserEditSchema>>
