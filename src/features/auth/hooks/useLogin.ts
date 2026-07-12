import { useMutation } from '@tanstack/react-query'

import { authApi } from '@/features/auth/api/auth.api'

export function useLogin() {
  return useMutation({ mutationFn: authApi.login })
}
