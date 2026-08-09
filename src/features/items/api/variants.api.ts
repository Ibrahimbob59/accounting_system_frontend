import { http } from '@/lib/api-client'
import type {
  GenerateResult,
  GenerateVariantsInput,
  ItemVariant,
  VariantInput,
} from '@/features/items/types/items.types'

/** Item variants — nested under an item (backend `/items/:itemId/variants`). */
export const variantsApi = {
  list(itemId: string): Promise<ItemVariant[]> {
    return http.get<ItemVariant[]>(`/items/${itemId}/variants`)
  },

  create(itemId: string, input: VariantInput): Promise<ItemVariant> {
    return http.post<ItemVariant>(`/items/${itemId}/variants`, input)
  },

  generate(
    itemId: string,
    input: GenerateVariantsInput
  ): Promise<GenerateResult> {
    return http.post<GenerateResult>(
      `/items/${itemId}/variants/generate`,
      input
    )
  },

  update(
    itemId: string,
    variantId: string,
    input: { sku?: string; isActive?: boolean }
  ): Promise<ItemVariant> {
    return http.patch<ItemVariant>(
      `/items/${itemId}/variants/${variantId}`,
      input
    )
  },

  remove(itemId: string, variantId: string): Promise<void> {
    return http.delete<void>(`/items/${itemId}/variants/${variantId}`)
  },
}
