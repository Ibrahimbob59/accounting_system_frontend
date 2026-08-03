import { useQuery } from '@tanstack/react-query'

import { invitationsApi } from '@/features/invitations/api/invitations.api'

/** Pending + accepted invitations for the active company (unpaginated). */
export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: invitationsApi.list,
  })
}
