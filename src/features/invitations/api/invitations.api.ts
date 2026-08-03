import { http } from '@/lib/api-client'
import type {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
} from '@/features/invitations/types/invitations.types'
import type {
  CreateInvitationDto,
  Invitation,
  InvitationDurationOption,
} from '@/features/users/types/users.types'

/**
 * Both halves of the invitation lifecycle live here: `accept` is public and
 * used by the unauthenticated AcceptInvitationPage; the rest are admin-side,
 * used from the Users screen.
 *
 * The admin-side types are imported from the users feature rather than
 * redefined, since an invitation is only ever created or listed in the context
 * of user management — one definition, one place to change.
 */
export const invitationsApi = {
  accept(body: AcceptInvitationRequest): Promise<AcceptInvitationResponse> {
    return http.post<AcceptInvitationResponse>('/invitations/accept', body)
  },

  /** Returns a plain array — unlike `/users`, this endpoint is not paginated. */
  list(): Promise<Invitation[]> {
    return http.get<Invitation[]>('/invitations')
  },

  create(dto: CreateInvitationDto): Promise<Invitation> {
    return http.post<Invitation>('/invitations', dto)
  },

  /** Revokes a pending invitation. Responds 204 with no body. */
  revoke(id: string): Promise<void> {
    return http.delete<void>(`/invitations/${id}`)
  },

  listDurations(): Promise<InvitationDurationOption[]> {
    return http.get<InvitationDurationOption[]>('/invitations/durations')
  },
}
