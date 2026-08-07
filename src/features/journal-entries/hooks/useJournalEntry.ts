import { useQuery } from '@tanstack/react-query'

import { journalEntriesApi } from '@/features/journal-entries/api/journal-entries.api'

/** A single journal entry with its lines. */
export function useJournalEntry(id: string | undefined) {
  return useQuery({
    queryKey: ['journal-entries', id],
    queryFn: () => journalEntriesApi.get(id as string),
    enabled: !!id,
  })
}
