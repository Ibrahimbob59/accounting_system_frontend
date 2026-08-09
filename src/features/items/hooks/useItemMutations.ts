import { useMutation, useQueryClient } from '@tanstack/react-query'

import { itemsApi } from '@/features/items/api/items.api'
import type {
  CreateItemDto,
  UpdateItemDto,
} from '@/features/items/types/items.types'

/** Every write invalidates the `items` key so the list and any open detail
 *  refetch. */
function useInvalidateItems() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['items'] })
}

export function useCreateItem() {
  const invalidate = useInvalidateItems()
  return useMutation({
    mutationFn: (dto: CreateItemDto) => itemsApi.create(dto),
    onSuccess: () => void invalidate(),
  })
}

export function useUpdateItem() {
  const invalidate = useInvalidateItems()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateItemDto }) =>
      itemsApi.update(id, dto),
    onSuccess: () => void invalidate(),
  })
}

export function useDeleteItem() {
  const invalidate = useInvalidateItems()
  return useMutation({
    mutationFn: (id: string) => itemsApi.remove(id),
    onSuccess: () => void invalidate(),
  })
}
