import { http } from '@/lib/api-client'
import type {
  ConvertUomResult,
  Uom,
  UomCategory,
  UomCategoryInput,
  UomInput,
} from '@/features/uom/types/uom.types'

/** Units of measure + their categories. Both list endpoints return plain arrays
 *  (not paginated). */
export const uomApi = {
  listUoms(categoryId?: string): Promise<Uom[]> {
    return http.get<Uom[]>('/uoms', {
      params: categoryId ? { categoryId } : undefined,
    })
  },

  listCategories(): Promise<UomCategory[]> {
    return http.get<UomCategory[]>('/uom-categories')
  },

  createCategory(input: UomCategoryInput): Promise<UomCategory> {
    return http.post<UomCategory>('/uom-categories', input)
  },

  updateCategory(id: string, input: UomCategoryInput): Promise<UomCategory> {
    return http.patch<UomCategory>(`/uom-categories/${id}`, input)
  },

  removeCategory(id: string): Promise<void> {
    return http.delete<void>(`/uom-categories/${id}`)
  },

  createUom(input: UomInput): Promise<Uom> {
    return http.post<Uom>('/uoms', input)
  },

  updateUom(id: string, input: UomInput): Promise<Uom> {
    return http.patch<Uom>(`/uoms/${id}`, input)
  },

  removeUom(id: string): Promise<void> {
    return http.delete<void>(`/uoms/${id}`)
  },

  convert(
    qty: number,
    fromUomId: string,
    toUomId: string
  ): Promise<ConvertUomResult> {
    return http.get<ConvertUomResult>('/uoms/convert', {
      params: { qty, fromUomId, toUomId },
    })
  },
}
