import { useQuery } from '@tanstack/react-query'

import { paymentsApi } from '@/features/payments/api/payments.api'
import type { ListPaymentsQuery } from '@/features/payments/types/payments.types'

export function usePayments(query?: ListPaymentsQuery) {
  return useQuery({
    queryKey: ['payments', query ?? {}],
    queryFn: () => paymentsApi.list(query),
    placeholderData: (prev) => prev,
  })
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsApi.get(id as string),
    enabled: !!id,
  })
}
