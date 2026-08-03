import { useMutation, useQueryClient } from '@tanstack/react-query'

import { companiesApi } from '@/features/companies/api/companies.api'
import type { UpdateCompanySettingsDto } from '@/features/companies/types/companies.types'

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCompanySettingsDto }) =>
      companiesApi.updateSettings(id, dto),
    onSuccess: () => {
      // Also drops `companies` — baseCurrencyCode lives on the company record
      // too, so a settings change makes the cached company stale.
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
