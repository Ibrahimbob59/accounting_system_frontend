import { RouterProvider } from 'react-router-dom'

import { router } from '@/app/router'
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap'
import { QueryProvider } from './QueryProvider'

/**
 * Top-level composition: data layer (TanStack Query) wrapping the router.
 * The boot-time silent refresh is kicked off here so it runs once, above the
 * route tree.
 */
export function AppProviders() {
  useAuthBootstrap()

  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}
