import { useQuery } from '@tanstack/react-query'

import { salesInvoicesApi } from '@/features/invoicing/api/sales-invoices.api'
import type { ListSalesInvoicesQuery } from '@/features/invoicing/types/invoicing.types'

export function useSalesInvoices(query?: ListSalesInvoicesQuery) {
  return useQuery({
    queryKey: ['sales-invoices', query ?? {}],
    queryFn: () => salesInvoicesApi.list(query),
    placeholderData: (prev) => prev,
  })
}

export function useSalesInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['sales-invoices', id],
    queryFn: () => salesInvoicesApi.get(id as string),
    enabled: !!id,
  })
}
