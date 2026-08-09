import { useQuery } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'
import type { Partner } from '@/features/partners/types/partners.types'

/**
 * Every partner, flat — for id→name resolution and customer/supplier pickers
 * where a payload carries a partnerId but no name (e.g. sales invoices). Pages
 * through the paginated list and accumulates; fine for the app's scale.
 */
export function useAllPartners() {
  return useQuery({
    queryKey: ['partners', 'all'],
    queryFn: async () => {
      const first = await partnersApi.listPartners({ page: 1, limit: 100 })
      const totalPages = first.meta?.totalPages ?? 1
      const partners = [...first.data]
      for (let page = 2; page <= totalPages; page++) {
        const next = await partnersApi.listPartners({ page, limit: 100 })
        partners.push(...next.data)
      }
      return partners as Partner[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
