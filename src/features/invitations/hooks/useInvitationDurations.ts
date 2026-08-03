import { useQuery } from '@tanstack/react-query'

import { invitationsApi } from '@/features/invitations/api/invitations.api'

/** Expiry options for the invite dialog. Fetched rather than hardcoded so the
 * choices can't drift from the backend's InvitationDuration enum; effectively
 * static, hence the long staleTime. */
export function useInvitationDurations() {
  return useQuery({
    queryKey: ['invitations', 'durations'],
    queryFn: invitationsApi.listDurations,
    staleTime: 60 * 60 * 1000,
  })
}
