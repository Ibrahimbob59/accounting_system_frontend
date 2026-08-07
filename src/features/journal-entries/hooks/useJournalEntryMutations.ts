import { useMutation, useQueryClient } from '@tanstack/react-query'

import { journalEntriesApi } from '@/features/journal-entries/api/journal-entries.api'
import type {
  CreateJournalEntryDto,
  ReverseJournalEntryDto,
  UpdateJournalEntryDto,
} from '@/features/journal-entries/types/journal-entries.types'

/**
 * Every write invalidates the `journal-entries` key, so the list and any open
 * detail refetch. Posting and reversing also move ledger balances, so they
 * additionally invalidate `accounts` (account balances) and `partners`
 * (partner statements) — the two read models a posted entry feeds.
 */
function useInvalidateJournal() {
  const queryClient = useQueryClient()
  return (opts?: { ledger?: boolean }) => {
    void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    if (opts?.ledger) {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
    }
  }
}

export function useCreateJournalEntry() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: (dto: CreateJournalEntryDto) => journalEntriesApi.create(dto),
    onSuccess: () => invalidate(),
  })
}

export function useUpdateJournalEntry() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateJournalEntryDto }) =>
      journalEntriesApi.update(id, dto),
    onSuccess: () => invalidate(),
  })
}

export function useDeleteJournalEntry() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: (id: string) => journalEntriesApi.remove(id),
    onSuccess: () => invalidate(),
  })
}

export function usePostJournalEntry() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: (id: string) => journalEntriesApi.post(id),
    onSuccess: () => invalidate({ ledger: true }),
  })
}

export function useReverseJournalEntry() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReverseJournalEntryDto }) =>
      journalEntriesApi.reverse(id, dto),
    onSuccess: () => invalidate({ ledger: true }),
  })
}
