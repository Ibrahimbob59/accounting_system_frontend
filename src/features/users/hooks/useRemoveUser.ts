import { useMutation, useQueryClient } from '@tanstack/react-query'

import { usersApi } from '@/features/users/api/users.api'

export function useRemoveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.removeUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
