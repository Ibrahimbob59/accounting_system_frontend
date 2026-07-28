import { http } from '@/lib/api-client'
import type {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
} from '@/features/invitations/types/invitations.types'

export const invitationsApi = {
  accept(body: AcceptInvitationRequest): Promise<AcceptInvitationResponse> {
    return http.post<AcceptInvitationResponse>('/invitations/accept', body)
  },
}
