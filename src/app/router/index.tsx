import { createBrowserRouter } from 'react-router-dom'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { PublicOnlyGuard } from '@/features/auth/components/PublicOnlyGuard'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'

/**
 * Route tree. Public marketing + auth screens are gated by PublicOnlyGuard (an
 * authenticated visitor is bounced to `/app`); the product lives behind
 * AuthGuard under the `/app` prefix — a placeholder until Phase 2's app shell.
 */
export const router = createBrowserRouter([
  // Public group — redirects to '/app' if already authenticated.
  {
    element: <PublicOnlyGuard />,
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
    children: [{ path: '/app', element: <div>TODO: Phase 2</div> }],
  },
])
