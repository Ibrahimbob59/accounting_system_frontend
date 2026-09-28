import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { purchaseOrdersApi } from '@/features/purchasing/api/purchase-orders.api'
import type {
  CreatePurchaseOrderInput,
  ListPurchaseOrdersQuery,
} from '@/features/purchasing/types/purchasing.types'

export function usePurchaseOrders(query?: ListPurchaseOrdersQuery) {
  return useQuery({
    queryKey: ['purchase-orders', query ?? {}],
    queryFn: () => purchaseOrdersApi.list(query),
    placeholderData: (prev) => prev,
  })
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => purchaseOrdersApi.get(id as string),
    enabled: !!id,
  })
}

function useInvalidate() {
  const queryClient = useQueryClient()
  return () =>
    void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
}

export function useCreatePurchaseOrder() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderInput) =>
      purchaseOrdersApi.create(dto),
    onSuccess: () => invalidate(),
  })
}

export function useUpdatePurchaseOrder() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string
      dto: Partial<CreatePurchaseOrderInput>
    }) => purchaseOrdersApi.update(id, dto),
    onSuccess: () => invalidate(),
  })
}

export function useConfirmPurchaseOrder() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.confirm(id),
    onSuccess: () => invalidate(),
  })
}

export function useCancelPurchaseOrder() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.cancel(id),
    onSuccess: () => invalidate(),
  })
}

export function useDeletePurchaseOrder() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.remove(id),
    onSuccess: () => invalidate(),
  })
}
