import { http } from '@/lib/api-client'
import type {
  BarcodeInput,
  ItemBarcode,
} from '@/features/items/types/items.types'

/** Item barcodes — nested under an item (backend `/items/:itemId/barcodes`). */
export const barcodesApi = {
  list(itemId: string): Promise<ItemBarcode[]> {
    return http.get<ItemBarcode[]>(`/items/${itemId}/barcodes`)
  },

  create(itemId: string, input: BarcodeInput): Promise<ItemBarcode> {
    return http.post<ItemBarcode>(`/items/${itemId}/barcodes`, input)
  },

  update(
    itemId: string,
    barcodeId: string,
    input: { barcode?: string; isPrimary?: boolean }
  ): Promise<ItemBarcode> {
    return http.patch<ItemBarcode>(
      `/items/${itemId}/barcodes/${barcodeId}`,
      input
    )
  },

  remove(itemId: string, barcodeId: string): Promise<void> {
    return http.delete<void>(`/items/${itemId}/barcodes/${barcodeId}`)
  },
}
