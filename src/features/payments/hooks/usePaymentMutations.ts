import { useMutation, useQueryClient } from '@tanstack/react-query'

import { paymentsApi } from '@/features/payments/api/payments.api'
import type { CreatePaymentInput } from '@/features/payments/types/payments.types'

/** A payment posts (or voids) a journal entry and moves a partner balance, so
 *  writes invalidate payments plus everything derived from the ledger: the
 *  partner balances/open-items, accounts, journal entries, and the settled
 *  documents (sales invoices / vendor bills). */
function useInvalidate() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['payments'] })
    void queryClient.invalidateQueries({ queryKey: ['partners'] })
    void queryClient.invalidateQueries({ queryKey: ['accounts'] })
    void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    void queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
    void queryClient.invalidateQueries({ queryKey: ['vendor-bills'] })
  }
}

export function useCreatePayment() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (dto: CreatePaymentInput) => paymentsApi.create(dto),
    onSuccess: () => invalidate(),
  })
}

export function useVoidPayment() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => paymentsApi.void(id),
    onSuccess: () => invalidate(),
  })
}
