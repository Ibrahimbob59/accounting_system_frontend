import { useQuery } from '@tanstack/react-query'

import { invitationsApi } from '@/features/invitations/api/invitations.api'

/**
 * Accepting an invitation is a POST, but from the page's point of view it's a
 * one-shot "resolve this token" read: arriving with a valid token IS the
 * action, there's no form to submit, and it must happen exactly once.
 *
 * That's why this is a `useQuery` and not a `useMutation`, despite the verb.
 * `useMutation` state lives on a per-component observer, so it resets when the
 * component unmounts — which `<StrictMode>` does deliberately on every mount in
 * development. Paired with a `useRef` "already fired" guard, that left the page
 * stuck on its spinner forever: the guard survived the remount, the mutation
 * result did not, so the request never re-fired and `isSuccess` never arrived.
 *
 * The query cache is global and keyed by token, so it survives the remount and
 * IS the run-once guard — no ref needed. Concurrent duplicates dedupe on the
 * key, so the backend still sees exactly one POST per token.
 *
 * The refetch options below are load-bearing, not defensive boilerplate: this
 * request consumes the token server-side, so a retry, a refocus refetch or a
 * remount refetch would come back INVITATION_ALREADY_ACCEPTED and show the user
 * a failure for something that had actually succeeded.
 */
export function useAcceptInvitation(token: string) {
  return useQuery({
    queryKey: ['invitations', 'accept', token],
    queryFn: () => invitationsApi.accept({ token }),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
