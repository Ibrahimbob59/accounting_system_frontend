import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { goodsReceiptsApi } from '@/features/purchasing/api/goods-receipts.api'
import type {
  CreateGoodsReceiptInput,
  ListGoodsReceiptsQuery,
} from '@/features/purchasing/types/purchasing.types'

export function useGoodsReceipts(query?: ListGoodsReceiptsQuery) {
  return useQuery({
    queryKey: ['goods-receipts', query ?? {}],
    queryFn: () => goodsReceiptsApi.list(query),
    placeholderData: (prev) => prev,
  })
}

export function useGoodsReceipt(id: string | undefined) {
  return useQuery({
    queryKey: ['goods-receipts', id],
    queryFn: () => goodsReceiptsApi.get(id as string),
    enabled: !!id,
  })
}

/** Receiving goods moves stock and updates the PO's received quantities. */
export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateGoodsReceiptInput) => goodsReceiptsApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goods-receipts'] })
      void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      void queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}
