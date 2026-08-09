import { useQuery } from '@tanstack/react-query'

import { itemsApi } from '@/features/items/api/items.api'
import type { ListItemsQuery } from '@/features/items/types/items.types'

/** The filterable, paginated item list. */
export function useItems(query?: ListItemsQuery) {
  return useQuery({
    queryKey: ['items', query ?? {}],
    queryFn: () => itemsApi.list(query),
    placeholderData: (prev) => prev,
  })
}
