import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { stockTransfersApi } from '@/features/stock/api/stock-transfers.api'
import type { ListStockTransfersQuery } from '@/features/stock/types/stock-ops.types'

export function useStockTransfers(query?: ListStockTransfersQuery) {
  return useQuery({
    queryKey: ['stock-transfers', query ?? {}],
    queryFn: () => stockTransfersApi.list(query),
    placeholderData: (prev) => prev,
  })
}

export function useStockTransfer(id: string | undefined) {
  return useQuery({
    queryKey: ['stock-transfers', id],
    queryFn: () => stockTransfersApi.get(id as string),
    enabled: !!id,
  })
}

/** Posting a transfer relocates stock (value-neutral, no journal), so it
 *  invalidates transfers and the stock on-hand views. */
function useInvalidate() {
  const queryClient = useQueryClient()
  return (opts?: { posted?: boolean }) => {
    void queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
    if (opts?.posted)
      void queryClient.invalidateQueries({ queryKey: ['stock'] })
  }
}

export function useCreateStockTransfer() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: stockTransfersApi.create,
    onSuccess: () => invalidate(),
  })
}

export function useApproveStockTransfer() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => stockTransfersApi.approve(id),
    onSuccess: () => invalidate(),
  })
}

export function usePostStockTransfer() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => stockTransfersApi.post(id),
    onSuccess: () => invalidate({ posted: true }),
  })
}

export function useDeleteStockTransfer() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => stockTransfersApi.remove(id),
    onSuccess: () => invalidate(),
  })
}
