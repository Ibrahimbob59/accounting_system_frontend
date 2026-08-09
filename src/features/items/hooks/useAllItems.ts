import { useQuery } from '@tanstack/react-query'

import { itemsApi } from '@/features/items/api/items.api'
import type { Item } from '@/features/items/types/items.types'

/**
 * Every item, flat — for id→name resolution where a payload carries an itemId
 * but no name (e.g. the stock on-hand rows). `GET /items` is paginated with a
 * backend `limit` ceiling of 100, so this pages through and accumulates.
 *
 * Fine for the app's scale (hundreds of items); if a catalog ever grows large
 * enough that this is costly, the stock endpoints should embed the item name
 * instead. Cached for a few minutes since it's read purely for labels.
 */
export function useAllItems() {
  return useQuery({
    queryKey: ['items', 'all'],
    queryFn: async () => {
      const first = await itemsApi.list({ page: 1, limit: 100 })
      const totalPages = first.meta?.totalPages ?? 1
      const items = [...first.data]
      for (let page = 2; page <= totalPages; page++) {
        const next = await itemsApi.list({ page, limit: 100 })
        items.push(...next.data)
      }
      return items as Item[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
