import { useQuery } from '@tanstack/react-query'

import { paymentsApi } from '@/features/payments/api/payments.api'
import type { PaymentDirection } from '@/features/payments/types/payments.types'

/** Open documents for a partner to allocate a payment against — the customer's
 *  open sales invoices (IN) or the supplier's open vendor bills (OUT). Only
 *  runs once both a partner and a direction are chosen. */
export function useOpenItems(
  partnerId: string | undefined,
  direction: PaymentDirection | undefined
) {
  return useQuery({
    queryKey: ['payments', 'open-items', partnerId, direction],
    queryFn: () =>
      paymentsApi.openItems(partnerId as string, direction as PaymentDirection),
    enabled: !!partnerId && !!direction,
  })
}
