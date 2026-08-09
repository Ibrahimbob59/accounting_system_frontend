import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreateItemDto,
  Item,
  ListItemsQuery,
  UpdateItemDto,
} from '@/features/items/types/items.types'

/** Items (backend Odoo product.template). */
export const itemsApi = {
  list(query?: ListItemsQuery): Promise<ApiSuccess<Item[]>> {
    return http.getPage<Item[]>('/items', { params: query })
  },

  get(id: string): Promise<Item> {
    return http.get<Item>(`/items/${id}`)
  },

  create(dto: CreateItemDto): Promise<Item> {
    return http.post<Item>('/items', dto)
  },

  update(id: string, dto: UpdateItemDto): Promise<Item> {
    return http.patch<Item>(`/items/${id}`, dto)
  },

  /** Soft delete. */
  remove(id: string): Promise<void> {
    return http.delete<void>(`/items/${id}`)
  },
}
