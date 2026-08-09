import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { variantsApi } from '@/features/items/api/variants.api'
import type {
  GenerateVariantsInput,
  VariantInput,
} from '@/features/items/types/items.types'

export function useVariants(itemId: string | undefined) {
  return useQuery({
    queryKey: ['items', itemId, 'variants'],
    queryFn: () => variantsApi.list(itemId as string),
    enabled: !!itemId,
  })
}

function useInvalidate(itemId: string) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ['items', itemId, 'variants'] })
}

export function useCreateVariant(itemId: string) {
  const invalidate = useInvalidate(itemId)
  return useMutation({
    mutationFn: (input: VariantInput) => variantsApi.create(itemId, input),
    onSuccess: () => void invalidate(),
  })
}

export function useGenerateVariants(itemId: string) {
  const invalidate = useInvalidate(itemId)
  return useMutation({
    mutationFn: (input: GenerateVariantsInput) =>
      variantsApi.generate(itemId, input),
    onSuccess: () => void invalidate(),
  })
}

export function useUpdateVariant(itemId: string) {
  const invalidate = useInvalidate(itemId)
  return useMutation({
    mutationFn: ({
      variantId,
      input,
    }: {
      variantId: string
      input: { sku?: string; isActive?: boolean }
    }) => variantsApi.update(itemId, variantId, input),
    onSuccess: () => void invalidate(),
  })
}

export function useDeleteVariant(itemId: string) {
  const invalidate = useInvalidate(itemId)
  return useMutation({
    mutationFn: (variantId: string) => variantsApi.remove(itemId, variantId),
    onSuccess: () => void invalidate(),
  })
}
