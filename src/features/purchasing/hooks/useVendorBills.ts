import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { vendorBillsApi } from '@/features/purchasing/api/vendor-bills.api'
import type {
  CreateVendorBillInput,
  ListVendorBillsQuery,
} from '@/features/purchasing/types/purchasing.types'

export function useVendorBills(query?: ListVendorBillsQuery) {
  return useQuery({
    queryKey: ['vendor-bills', query ?? {}],
    queryFn: () => vendorBillsApi.list(query),
    placeholderData: (prev) => prev,
  })
}

export function useVendorBill(id: string | undefined) {
  return useQuery({
    queryKey: ['vendor-bills', id],
    queryFn: () => vendorBillsApi.get(id as string),
    enabled: !!id,
  })
}

/** Confirming a bill posts a journal entry and moves the supplier balance, so
 *  it invalidates accounts, journal entries and partners too. */
function useInvalidate() {
  const queryClient = useQueryClient()
  return (opts?: { posted?: boolean }) => {
    void queryClient.invalidateQueries({ queryKey: ['vendor-bills'] })
    void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    if (opts?.posted) {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
      void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    }
  }
}

export function useCreateVendorBill() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (dto: CreateVendorBillInput) => vendorBillsApi.create(dto),
    onSuccess: () => invalidate(),
  })
}

export function useConfirmVendorBill() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => vendorBillsApi.confirm(id),
    onSuccess: () => invalidate({ posted: true }),
  })
}

export function useDeleteVendorBill() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => vendorBillsApi.remove(id),
    onSuccess: () => invalidate(),
  })
}
