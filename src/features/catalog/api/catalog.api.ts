import { http } from '@/lib/api-client'
import {
  LOOKUP_PATHS,
  type CatalogLookup,
  type CatalogLookupInput,
  type LookupKind,
} from '@/features/catalog/types/catalog.types'

/**
 * Catalog lookups. Each kind is a small, unpaginated collection (the backend
 * returns a plain array, not a page).
 */
export const catalogApi = {
  list(kind: LookupKind): Promise<CatalogLookup[]> {
    return http.get<CatalogLookup[]>(`/${LOOKUP_PATHS[kind]}`)
  },

  create(kind: LookupKind, input: CatalogLookupInput): Promise<CatalogLookup> {
    return http.post<CatalogLookup>(`/${LOOKUP_PATHS[kind]}`, input)
  },

  update(
    kind: LookupKind,
    id: string,
    input: CatalogLookupInput
  ): Promise<CatalogLookup> {
    return http.patch<CatalogLookup>(`/${LOOKUP_PATHS[kind]}/${id}`, input)
  },

  remove(kind: LookupKind, id: string): Promise<void> {
    return http.delete<void>(`/${LOOKUP_PATHS[kind]}/${id}`)
  },
}
