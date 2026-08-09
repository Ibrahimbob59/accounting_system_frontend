import { useMutation, useQueryClient } from '@tanstack/react-query'

import { uomApi } from '@/features/uom/api/uom.api'
import type { UomCategoryInput, UomInput } from '@/features/uom/types/uom.types'

/** Any UoM write invalidates both collections (units are shown per category)
 *  and items (an item names its base/sales/purchase unit). */
function useInvalidateUom() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['uoms'] })
    void queryClient.invalidateQueries({ queryKey: ['uom-categories'] })
    void queryClient.invalidateQueries({ queryKey: ['items'] })
  }
}

export function useCreateUomCategory() {
  const invalidate = useInvalidateUom()
  return useMutation({
    mutationFn: (input: UomCategoryInput) => uomApi.createCategory(input),
    onSuccess: invalidate,
  })
}

export function useUpdateUomCategory() {
  const invalidate = useInvalidateUom()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UomCategoryInput }) =>
      uomApi.updateCategory(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteUomCategory() {
  const invalidate = useInvalidateUom()
  return useMutation({
    mutationFn: (id: string) => uomApi.removeCategory(id),
    onSuccess: invalidate,
  })
}

export function useCreateUom() {
  const invalidate = useInvalidateUom()
  return useMutation({
    mutationFn: (input: UomInput) => uomApi.createUom(input),
    onSuccess: invalidate,
  })
}

export function useUpdateUom() {
  const invalidate = useInvalidateUom()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UomInput }) =>
      uomApi.updateUom(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteUom() {
  const invalidate = useInvalidateUom()
  return useMutation({
    mutationFn: (id: string) => uomApi.removeUom(id),
    onSuccess: invalidate,
  })
}
