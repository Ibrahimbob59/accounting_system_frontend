import { useQuery } from '@tanstack/react-query'

import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'

/** A company branch (backend branches module). Minimal shape — Phase 1 only
 * needs id + name for the location form's branch picker. */
export interface Branch {
  id: string
  name: string
}

/**
 * The company's branches. `GET /branches` is paginated; a company has only a
 * handful, so one generous page fetches them all for the picker.
 */
export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () =>
      http.getPage<Branch[]>('/branches', { params: { limit: 100 } }),
    staleTime: 5 * 60 * 1000,
    select: (res: ApiSuccess<Branch[]>) => res.data,
  })
}
