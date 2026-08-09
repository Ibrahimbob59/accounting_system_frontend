import { useQuery } from '@tanstack/react-query'

import { catalogApi } from '@/features/catalog/api/catalog.api'
import type { LookupKind } from '@/features/catalog/types/catalog.types'

/**
 * A catalog lookup collection (categories, brands, families, sizes, colours).
 * Cached a while — these are small, near-static reference lists read by the item
 * list filters, the item form's pickers, and id→name resolution on the detail
 * page. One hook per kind keeps the query keys distinct and cache-friendly.
 */
export function useLookups(kind: LookupKind) {
  return useQuery({
    queryKey: ['catalog', kind],
    queryFn: () => catalogApi.list(kind),
    staleTime: 5 * 60 * 1000,
  })
}

export const useItemCategories = () => useLookups('itemCategory')
export const useBrands = () => useLookups('brand')
export const useFamilies = () => useLookups('family')
