import { useMutation } from '@tanstack/react-query'

import { authApi } from '@/features/auth/api/auth.api'

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword })
}
