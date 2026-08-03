import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invitationsApi } from '@/features/invitations/api/invitations.api'

export function useCreateInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: invitationsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}
