import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { stockCountsApi } from '@/features/stock/api/stock-counts.api'
import type { ListStockCountsQuery } from '@/features/stock/types/stock-ops.types'

export function useStockCounts(query?: ListStockCountsQuery) {
  return useQuery({
    queryKey: ['stock-counts', query ?? {}],
    queryFn: () => stockCountsApi.list(query),
    placeholderData: (prev) => prev,
  })
}

export function useStockCount(id: string | undefined) {
  return useQuery({
    queryKey: ['stock-counts', id],
    queryFn: () => stockCountsApi.get(id as string),
    enabled: !!id,
  })
}

/** Posting a count moves stock and posts a variance journal, so it invalidates
 *  stock, accounts and journal entries too. */
function useInvalidate() {
  const queryClient = useQueryClient()
  return (opts?: { posted?: boolean }) => {
    void queryClient.invalidateQueries({ queryKey: ['stock-counts'] })
    if (opts?.posted) {
      void queryClient.invalidateQueries({ queryKey: ['stock'] })
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    }
  }
}

export function useCreateStockCount() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: stockCountsApi.create,
    onSuccess: () => invalidate(),
  })
}

export function usePostStockCount() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => stockCountsApi.post(id),
    onSuccess: () => invalidate({ posted: true }),
  })
}

export function useDeleteStockCount() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => stockCountsApi.remove(id),
    onSuccess: () => invalidate(),
  })
}
