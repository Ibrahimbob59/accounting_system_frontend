import { useMutation, useQueryClient } from '@tanstack/react-query'

import { catalogApi } from '@/features/catalog/api/catalog.api'
import type {
  CatalogLookupInput,
  LookupKind,
} from '@/features/catalog/types/catalog.types'

/** Invalidate the affected lookup collection so its list refetches. Items also
 *  invalidate — an item row shows its category/brand name. */
function useInvalidateCatalog(kind: LookupKind) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['catalog', kind] })
    void queryClient.invalidateQueries({ queryKey: ['items'] })
  }
}

export function useCreateLookup(kind: LookupKind) {
  const invalidate = useInvalidateCatalog(kind)
  return useMutation({
    mutationFn: (input: CatalogLookupInput) => catalogApi.create(kind, input),
    onSuccess: invalidate,
  })
}

export function useUpdateLookup(kind: LookupKind) {
  const invalidate = useInvalidateCatalog(kind)
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CatalogLookupInput }) =>
      catalogApi.update(kind, id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteLookup(kind: LookupKind) {
  const invalidate = useInvalidateCatalog(kind)
  return useMutation({
    mutationFn: (id: string) => catalogApi.remove(kind, id),
    onSuccess: invalidate,
  })
}
