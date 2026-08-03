import { useMutation, useQueryClient } from '@tanstack/react-query'

import { usersApi } from '@/features/users/api/users.api'
import type { UpdateUserDto } from '@/features/users/types/users.types'

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      usersApi.updateUser(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
