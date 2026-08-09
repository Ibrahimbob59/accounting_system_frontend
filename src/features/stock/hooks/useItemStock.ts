import { useQuery } from '@tanstack/react-query'

import { stockApi } from '@/features/stock/api/stock.api'

/** One item's stock — total qty/value plus a per-variant, per-location
 *  breakdown. Keyed under the item so a stock op on that item refetches it. */
export function useItemStock(itemId: string | undefined) {
  return useQuery({
    queryKey: ['stock', 'item', itemId],
    queryFn: () => stockApi.itemStock(itemId as string),
    enabled: !!itemId,
  })
}
