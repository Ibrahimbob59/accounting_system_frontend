import { useMutation } from '@tanstack/react-query'

import { authApi } from '@/features/auth/api/auth.api'

export function useChangePassword() {
  return useMutation({ mutationFn: authApi.changePassword })
}
