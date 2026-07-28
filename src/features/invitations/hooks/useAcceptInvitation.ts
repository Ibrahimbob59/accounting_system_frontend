import { useMutation } from '@tanstack/react-query'

import { invitationsApi } from '@/features/invitations/api/invitations.api'

export function useAcceptInvitation() {
  return useMutation({ mutationFn: invitationsApi.accept })
}
