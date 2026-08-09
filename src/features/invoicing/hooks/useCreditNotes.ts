import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { creditNotesApi } from '@/features/invoicing/api/credit-notes.api'
import type {
  CreateCreditNoteInput,
  ListCreditNotesQuery,
} from '@/features/invoicing/types/credit-notes.types'

export function useCreditNotes(query?: ListCreditNotesQuery) {
  return useQuery({
    queryKey: ['credit-notes', query ?? {}],
    queryFn: () => creditNotesApi.list(query),
    placeholderData: (prev) => prev,
  })
}

export function useCreditNote(id: string | undefined) {
  return useQuery({
    queryKey: ['credit-notes', id],
    queryFn: () => creditNotesApi.get(id as string),
    enabled: !!id,
  })
}

function useInvalidate() {
  const queryClient = useQueryClient()
  return (opts?: { posted?: boolean }) => {
    void queryClient.invalidateQueries({ queryKey: ['credit-notes'] })
    if (opts?.posted) {
      void queryClient.invalidateQueries({ queryKey: ['stock'] })
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
      void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    }
  }
}

export function useCreateCreditNote() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (dto: CreateCreditNoteInput) => creditNotesApi.create(dto),
    onSuccess: () => invalidate(),
  })
}

export function useConfirmCreditNote() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => creditNotesApi.confirm(id),
    onSuccess: () => invalidate({ posted: true }),
  })
}

export function useDeleteCreditNote() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => creditNotesApi.remove(id),
    onSuccess: () => invalidate(),
  })
}
