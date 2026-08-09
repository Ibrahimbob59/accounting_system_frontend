import { useQuery } from '@tanstack/react-query'

import { itemsApi } from '@/features/items/api/items.api'

/** A single item by id. */
export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => itemsApi.get(id as string),
    enabled: !!id,
  })
}
