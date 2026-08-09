import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { barcodesApi } from '@/features/items/api/barcodes.api'
import type { BarcodeInput } from '@/features/items/types/items.types'

export function useBarcodes(itemId: string | undefined) {
  return useQuery({
    queryKey: ['items', itemId, 'barcodes'],
    queryFn: () => barcodesApi.list(itemId as string),
    enabled: !!itemId,
  })
}

function useInvalidate(itemId: string) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ['items', itemId, 'barcodes'] })
}

export function useCreateBarcode(itemId: string) {
  const invalidate = useInvalidate(itemId)
  return useMutation({
    mutationFn: (input: BarcodeInput) => barcodesApi.create(itemId, input),
    onSuccess: () => void invalidate(),
  })
}

export function useUpdateBarcode(itemId: string) {
  const invalidate = useInvalidate(itemId)
  return useMutation({
    mutationFn: ({
      barcodeId,
      input,
    }: {
      barcodeId: string
      input: { barcode?: string; isPrimary?: boolean }
    }) => barcodesApi.update(itemId, barcodeId, input),
    onSuccess: () => void invalidate(),
  })
}

export function useDeleteBarcode(itemId: string) {
  const invalidate = useInvalidate(itemId)
  return useMutation({
    mutationFn: (barcodeId: string) => barcodesApi.remove(itemId, barcodeId),
    onSuccess: () => void invalidate(),
  })
}
