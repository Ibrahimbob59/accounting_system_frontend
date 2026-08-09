import { useMutation, useQueryClient } from '@tanstack/react-query'

import { salesInvoicesApi } from '@/features/invoicing/api/sales-invoices.api'
import type { CreateSalesInvoiceInput } from '@/features/invoicing/types/invoicing.types'

/** Writes invalidate the invoice list/detail. Confirming also moves stock and
 *  the ledger, so it additionally invalidates stock, accounts and partners. */
function useInvalidate() {
  const queryClient = useQueryClient()
  return (opts?: { posted?: boolean }) => {
    void queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
    if (opts?.posted) {
      void queryClient.invalidateQueries({ queryKey: ['stock'] })
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
      void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    }
  }
}

export function useCreateSalesInvoice() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (dto: CreateSalesInvoiceInput) => salesInvoicesApi.create(dto),
    onSuccess: () => invalidate(),
  })
}

export function useConfirmSalesInvoice() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => salesInvoicesApi.confirm(id),
    onSuccess: () => invalidate({ posted: true }),
  })
}

export function useDeleteSalesInvoice() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => salesInvoicesApi.remove(id),
    onSuccess: () => invalidate(),
  })
}
