import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreateCreditNoteInput,
  CreditNote,
  ListCreditNotesQuery,
} from '@/features/invoicing/types/credit-notes.types'

/** Credit notes (backend FR-6xx). Same lifecycle as invoices: DRAFT → confirm. */
export const creditNotesApi = {
  list(query?: ListCreditNotesQuery): Promise<ApiSuccess<CreditNote[]>> {
    return http.getPage<CreditNote[]>('/credit-notes', { params: query })
  },

  get(id: string): Promise<CreditNote> {
    return http.get<CreditNote>(`/credit-notes/${id}`)
  },

  create(dto: CreateCreditNoteInput): Promise<CreditNote> {
    return http.post<CreditNote>('/credit-notes', dto)
  },

  confirm(id: string): Promise<CreditNote> {
    return http.post<CreditNote>(`/credit-notes/${id}/confirm`)
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/credit-notes/${id}`)
  },
}
