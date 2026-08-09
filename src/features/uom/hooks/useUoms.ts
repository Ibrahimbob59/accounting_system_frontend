import { useQuery } from '@tanstack/react-query'

import { uomApi } from '@/features/uom/api/uom.api'

/** Every unit of measure (optionally within one category) — for pickers and
 *  id→name resolution. Cached a while; UoMs are near-static reference data. */
export function useUoms(categoryId?: string) {
  return useQuery({
    queryKey: ['uoms', categoryId ?? 'all'],
    queryFn: () => uomApi.listUoms(categoryId),
    staleTime: 5 * 60 * 1000,
  })
}

/** UoM categories — units only convert within a category. */
export function useUomCategories() {
  return useQuery({
    queryKey: ['uom-categories'],
    queryFn: () => uomApi.listCategories(),
    staleTime: 5 * 60 * 1000,
  })
}
