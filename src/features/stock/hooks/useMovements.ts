import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { stockApi } from '@/features/stock/api/stock.api'
import type {
  AdjustStockInput,
  ListMovementsQuery,
  TransferStockInput,
} from '@/features/stock/types/stock.types'

export function useMovements(query?: ListMovementsQuery) {
  return useQuery({
    queryKey: ['stock', 'movements', query ?? {}],
    queryFn: () => stockApi.listMovements(query),
    placeholderData: (prev) => prev,
  })
}

export function useValuation(asOf: string | undefined) {
  return useQuery({
    queryKey: ['stock', 'valuation', asOf ?? 'today'],
    queryFn: () => stockApi.valuation(asOf),
    placeholderData: (prev) => prev,
  })
}

/** A stock operation moves quantities, so it invalidates every derived read:
 *  movements, on-hand and valuation. */
function useInvalidateStock() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['stock'] })
}

export function useAdjustStock() {
  const invalidate = useInvalidateStock()
  return useMutation({
    mutationFn: (input: AdjustStockInput) => stockApi.adjust(input),
    onSuccess: () => void invalidate(),
  })
}

export function useTransferStock() {
  const invalidate = useInvalidateStock()
  return useMutation({
    mutationFn: (input: TransferStockInput) => stockApi.transfer(input),
    onSuccess: () => void invalidate(),
  })
}
