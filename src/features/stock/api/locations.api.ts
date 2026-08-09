import { http } from '@/lib/api-client'
import type {
  CreateLocationInput,
  ListLocationsQuery,
  StockLocation,
  UpdateLocationInput,
} from '@/features/stock/types/stock.types'

/** Stock locations. GET returns a plain array (not paginated). Only INTERNAL
 *  locations are user-managed; virtual ones are read-only. */
export const locationsApi = {
  list(query?: ListLocationsQuery): Promise<StockLocation[]> {
    return http.get<StockLocation[]>('/locations', { params: query })
  },

  create(input: CreateLocationInput): Promise<StockLocation> {
    return http.post<StockLocation>('/locations', input)
  },

  update(id: string, input: UpdateLocationInput): Promise<StockLocation> {
    return http.patch<StockLocation>(`/locations/${id}`, input)
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/locations/${id}`)
  },
}
