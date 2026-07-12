import { createBrowserRouter } from 'react-router-dom'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { PublicOnlyGuard } from '@/features/auth/components/PublicOnlyGuard'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { PrivacyPolicyPage } from '@/features/legal/pages/PrivacyPolicyPage'
import { NotFoundPage } from './NotFoundPage'
import { RouteErrorBoundary } from './RouteErrorBoundary'

/**
 * Route tree. Public marketing + auth screens are gated by PublicOnlyGuard (an
 * authenticated visitor is bounced to `/app`); the product lives behind
 * AuthGuard under the `/app` prefix — a placeholder until Phase 2's app shell.
 * A third, ungated group holds pages that make sense regardless of auth state
 * (e.g. the privacy policy) — no redirect either way.
 *
 * Every top-level group carries an errorElement so a genuine render/loader
 * exception gets RouteErrorBoundary's page instead of React Router's default
 * developer-facing error screen. The trailing `path: '*'` catches a
 * genuinely unmatched URL (typo, stale link, ...) directly with
 * NotFoundPage — that's the far more common case than an actual exception.
 */
export const router = createBrowserRouter([
  // Public group — redirects to '/app' if already authenticated.
  {
    element: <PublicOnlyGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Protected group — gated by the Zustand auth store. Every future business
  // screen nests under '/app'.
  {
    element: <AuthGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [{ path: '/app', element: <div>TODO: Phase 2</div> }],
  },

  // Ungated — accessible regardless of auth state (unlike the public group
  // above, an authenticated visitor is NOT redirected away from these).
  {
    errorElement: <RouteErrorBoundary />,
    children: [{ path: '/privacy-policy', element: <PrivacyPolicyPage /> }],
  },

  // Unmatched path — independent of auth state.
  { path: '*', element: <NotFoundPage /> },
])
