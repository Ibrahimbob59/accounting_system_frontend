import { http } from '@/lib/api-client'
import type { Uom, UomCategory } from '@/features/uom/types/uom.types'

/** Units of measure + their categories. Both endpoints return plain arrays
 *  (not paginated). Phase 1 exposes only the reads. */
export const uomApi = {
  listUoms(categoryId?: string): Promise<Uom[]> {
    return http.get<Uom[]>('/uoms', {
      params: categoryId ? { categoryId } : undefined,
    })
  },

  listCategories(): Promise<UomCategory[]> {
    return http.get<UomCategory[]>('/uom-categories')
  },
}
