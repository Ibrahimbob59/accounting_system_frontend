import { useMutation } from '@tanstack/react-query'

import { authApi } from '@/features/auth/api/auth.api'

export function useVerifyResetCode() {
  return useMutation({ mutationFn: authApi.verifyResetCode })
}
