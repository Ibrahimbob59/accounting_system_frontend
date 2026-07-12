import { useMutation } from '@tanstack/react-query'

import { authApi } from '@/features/auth/api/auth.api'

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword })
}
