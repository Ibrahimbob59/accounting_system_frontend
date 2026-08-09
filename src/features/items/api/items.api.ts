import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type { Item, ListItemsQuery } from '@/features/items/types/items.types'

/**
 * Items (backend Odoo product.template). Phase 1 is read-only (list + single);
 * create / edit / delete land in a later phase next to the endpoints they call.
 */
export const itemsApi = {
  list(query?: ListItemsQuery): Promise<ApiSuccess<Item[]>> {
    return http.getPage<Item[]>('/items', { params: query })
  },

  get(id: string): Promise<Item> {
    return http.get<Item>(`/items/${id}`)
  },
}
