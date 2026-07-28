import { createBrowserRouter } from 'react-router-dom'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { RequireAuth } from '@/features/auth/components/RequireAuth'
import { PublicOnlyGuard } from '@/features/auth/components/PublicOnlyGuard'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage'
import { SelectCompanyPage } from '@/features/auth/pages/SelectCompanyPage'
import { AcceptInvitationPage } from '@/features/invitations/pages/AcceptInvitationPage'
import { PrivacyPolicyPage } from '@/features/legal/pages/PrivacyPolicyPage'
import { AppLayout } from '@/app/shell/AppLayout'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { NotFoundPage } from './NotFoundPage'
import { RouteErrorBoundary } from './RouteErrorBoundary'

/**
 * Route tree, by access tier:
 *  - PublicOnlyGuard: marketing + auth screens; an authenticated visitor is
 *    bounced onward via the §2 resolver.
 *  - RequireAuth: authenticated but NOT subject to the §2 company/password
 *    checks — the change-password / select-company screens the AuthGuard
 *    redirects *to*, so they must stay reachable during that block.
 *  - AuthGuard: the `/app` product area, runs the full §2 routing decision.
 *  - Ungated: pages that make sense in any auth state, no redirect either way
 *    (/invitations/accept, /privacy-policy).
 *
 * Every top-level group carries an errorElement so a genuine render/loader
 * exception gets RouteErrorBoundary's page instead of React Router's default
 * developer-facing error screen. The trailing `path: '*'` catches a
 * genuinely unmatched URL (typo, stale link, ...) directly with
 * NotFoundPage — that's the far more common case than an actual exception.
 */
export const router = createBrowserRouter([
  // Public group — redirects authenticated users onward (§2 resolver).
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

  // Authenticated, but exempt from the company/password gating (§6).
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/change-password', element: <ChangePasswordPage /> },
      { path: '/select-company', element: <SelectCompanyPage /> },
    ],
  },

  // Protected group — gated by the full §2 decision. Every future business
  // screen nests under '/app', inside the AppLayout shell.
  {
    element: <AuthGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        handle: { crumbKey: 'shell:nav.dashboard' },
        children: [{ index: true, element: <DashboardPage /> }],
      },
    ],
  },

  // Ungated — accessible regardless of auth state (unlike the public group
  // above, an authenticated visitor is NOT redirected away from these).
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/invitations/accept', element: <AcceptInvitationPage /> },
      { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
    ],
  },

  // Unmatched path — independent of auth state.
  { path: '*', element: <NotFoundPage /> },
])
