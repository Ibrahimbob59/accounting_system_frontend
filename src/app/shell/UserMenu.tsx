import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, ChevronDown, KeyRound, LogOut } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useLogout } from '@/features/auth/hooks/useLogout'

function initials(first?: string, last?: string): string {
  const value =
    `${first?.charAt(0) ?? ''}${last?.charAt(0) ?? ''}`.toUpperCase()
  return value || '?'
}

/**
 * Top-bar account menu. "Switch company" is shown only for a genuinely
 * multi-company user (§4) — a single-company user or platform admin has nowhere
 * to switch to. "Change password" reuses the existing page for a voluntary
 * change; "Log out" clears the session and lands on /login.
 */
export function UserMenu() {
  const { t } = useTranslation('shell')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const companies = useAuthStore((s) => s.companies)
  const { logout } = useLogout()

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const showSwitchCompany = companies.length > 1

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-medium text-primary-900">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="size-8 object-cover"
              />
            ) : (
              initials(user?.firstName, user?.lastName)
            )}
          </span>
          <span className="hidden max-w-40 truncate font-medium text-text-primary sm:inline">
            {name}
          </span>
          <ChevronDown className="size-4 text-text-muted" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="truncate font-medium text-text-primary">{name}</div>
          {user?.email && (
            <div className="truncate text-xs font-normal text-text-muted">
              {user.email}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/change-password')}>
          <KeyRound />
          {t('userMenu.changePassword')}
        </DropdownMenuItem>
        {showSwitchCompany && (
          <DropdownMenuItem onSelect={() => navigate('/select-company')}>
            <Building2 />
            {t('userMenu.switchCompany')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void logout()
          }}
        >
          <LogOut />
          {t('userMenu.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
