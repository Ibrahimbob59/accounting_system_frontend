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
import { PartnersListPage } from '@/features/partners/pages/PartnersListPage'
import { PartnerCreatePage } from '@/features/partners/pages/PartnerCreatePage'
import { PartnerEditPage } from '@/features/partners/pages/PartnerEditPage'
import { PartnerDetailPage } from '@/features/partners/pages/PartnerDetailPage'
import { AccountsListPage } from '@/features/accounts/pages/AccountsListPage'
import { AccountCreatePage } from '@/features/accounts/pages/AccountCreatePage'
import { AccountEditPage } from '@/features/accounts/pages/AccountEditPage'
import { AccountDetailPage } from '@/features/accounts/pages/AccountDetailPage'
import { CompaniesListPage } from '@/features/companies/pages/CompaniesListPage'
import { CompanyCreatePage } from '@/features/companies/pages/CompanyCreatePage'
import { CompanyEditPage } from '@/features/companies/pages/CompanyEditPage'
import { CompanyDetailPage } from '@/features/companies/pages/CompanyDetailPage'
import { UsersListPage } from '@/features/users/pages/UsersListPage'
import { UserDetailPage } from '@/features/users/pages/UserDetailPage'
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
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'partners',
            handle: { crumbKey: 'shell:nav.partners' },
            children: [
              { index: true, element: <PartnersListPage /> },
              { path: 'new', element: <PartnerCreatePage /> },
              { path: ':id', element: <PartnerDetailPage /> },
              { path: ':id/edit', element: <PartnerEditPage /> },
            ],
          },
          {
            path: 'accounts',
            handle: { crumbKey: 'shell:nav.accounts' },
            children: [
              { index: true, element: <AccountsListPage /> },
              { path: 'new', element: <AccountCreatePage /> },
              { path: ':id', element: <AccountDetailPage /> },
              { path: ':id/edit', element: <AccountEditPage /> },
            ],
          },
          {
            path: 'companies',
            handle: { crumbKey: 'shell:nav.companies' },
            children: [
              { index: true, element: <CompaniesListPage /> },
              { path: 'new', element: <CompanyCreatePage /> },
              { path: ':id', element: <CompanyDetailPage /> },
              { path: ':id/edit', element: <CompanyEditPage /> },
            ],
          },
          {
            path: 'users',
            handle: { crumbKey: 'shell:nav.users' },
            children: [
              { index: true, element: <UsersListPage /> },
              { path: ':id', element: <UserDetailPage /> },
            ],
          },
        ],
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
