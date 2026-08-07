import { useQuery } from '@tanstack/react-query'

import { journalEntriesApi } from '@/features/journal-entries/api/journal-entries.api'
import type { ListJournalEntriesQuery } from '@/features/journal-entries/types/journal-entries.types'

/** The filterable, paginated list of journal entries. */
export function useJournalEntries(query?: ListJournalEntriesQuery) {
  return useQuery({
    queryKey: ['journal-entries', query ?? {}],
    queryFn: () => journalEntriesApi.list(query),
    placeholderData: (prev) => prev,
  })
}
