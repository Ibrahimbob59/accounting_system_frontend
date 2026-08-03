import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invitationsApi } from '@/features/invitations/api/invitations.api'

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: invitationsApi.revoke,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}
