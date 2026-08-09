import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { locationsApi } from '@/features/stock/api/locations.api'
import type {
  CreateLocationInput,
  ListLocationsQuery,
  UpdateLocationInput,
} from '@/features/stock/types/stock.types'

export function useLocations(query?: ListLocationsQuery) {
  return useQuery({
    queryKey: ['locations', query ?? {}],
    queryFn: () => locationsApi.list(query),
    staleTime: 5 * 60 * 1000,
  })
}

function useInvalidate() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['locations'] })
}

export function useCreateLocation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: CreateLocationInput) => locationsApi.create(input),
    onSuccess: () => void invalidate(),
  })
}

export function useUpdateLocation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLocationInput }) =>
      locationsApi.update(id, input),
    onSuccess: () => void invalidate(),
  })
}

export function useDeleteLocation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => locationsApi.remove(id),
    onSuccess: () => void invalidate(),
  })
}
