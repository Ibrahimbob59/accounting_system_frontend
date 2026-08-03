import { http } from '@/lib/api-client'
import type { Currency } from '@/features/currencies/types/currencies.types'

/**
 * Read-only for now — currency administration (create/update/delete) exists
 * backend-side but has no screen, and nothing in the product needs one yet.
 *
 * `listCurrencies` previously lived in partners.api.ts as an acknowledged
 * stopgap ("move it once a real Currencies module exists"). This is that
 * module, so partners now imports from here.
 */
export const currenciesApi = {
  listCurrencies(): Promise<Currency[]> {
    return http.get<Currency[]>('/currencies')
  },

  getCurrency(code: string): Promise<Currency> {
    return http.get<Currency>(`/currencies/${code}`)
  },
}
