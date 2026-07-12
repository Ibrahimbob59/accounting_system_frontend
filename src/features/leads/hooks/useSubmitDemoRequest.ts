import { useMutation } from '@tanstack/react-query'

import { leadsApi } from '@/features/leads/api/leads.api'

export function useSubmitDemoRequest() {
  return useMutation({ mutationFn: leadsApi.submitDemoRequest })
}
