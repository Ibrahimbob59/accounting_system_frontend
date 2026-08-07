import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreateJournalEntryDto,
  JournalEntry,
  ListJournalEntriesQuery,
  ReverseJournalEntryDto,
  UpdateJournalEntryDto,
} from '@/features/journal-entries/types/journal-entries.types'

/**
 * Journal entries — the manual general-ledger postings (backend FR-9xx GL).
 *
 * A DRAFT is fully mutable (create / edit / delete); posting assigns its number
 * and freezes it — after that the only change is a `reverse`, which creates the
 * opposite POSTED entry so the two net to zero.
 */
export const journalEntriesApi = {
  list(query?: ListJournalEntriesQuery): Promise<ApiSuccess<JournalEntry[]>> {
    return http.getPage<JournalEntry[]>('/journal-entries', { params: query })
  },

  get(id: string): Promise<JournalEntry> {
    return http.get<JournalEntry>(`/journal-entries/${id}`)
  },

  create(dto: CreateJournalEntryDto): Promise<JournalEntry> {
    return http.post<JournalEntry>('/journal-entries', dto)
  },

  update(id: string, dto: UpdateJournalEntryDto): Promise<JournalEntry> {
    return http.patch<JournalEntry>(`/journal-entries/${id}`, dto)
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/journal-entries/${id}`)
  },

  post(id: string): Promise<JournalEntry> {
    return http.post<JournalEntry>(`/journal-entries/${id}/post`)
  },

  reverse(id: string, dto: ReverseJournalEntryDto): Promise<JournalEntry> {
    return http.post<JournalEntry>(`/journal-entries/${id}/reverse`, dto)
  },
}
