import { http } from '@/lib/api-client'
import {
  LOOKUP_PATHS,
  type CatalogLookup,
  type LookupKind,
} from '@/features/catalog/types/catalog.types'

/**
 * Catalog lookups. Each kind is a small, unpaginated collection (the backend
 * returns a plain array, not a page). Phase 1 exposes only `list`; create /
 * update / delete are added alongside the management screens later.
 */
export const catalogApi = {
  list(kind: LookupKind): Promise<CatalogLookup[]> {
    return http.get<CatalogLookup[]>(`/${LOOKUP_PATHS[kind]}`)
  },
}
