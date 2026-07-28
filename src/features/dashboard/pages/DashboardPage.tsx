import { useTranslation } from 'react-i18next'
import { BookOpen, Users, UsersRound } from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { usePartnersCount } from '@/features/dashboard/hooks/usePartnersCount'
import { useUsersCount } from '@/features/dashboard/hooks/useUsersCount'
import { useAccountsCount } from '@/features/dashboard/hooks/useAccountsCount'

/**
 * The `/app` index page. Company-scoped stat cards for a normal user; a plain
 * "Platform admin" state for an admin with no active company (§5) — the
 * per-company counts don't apply to them, so we don't force the cards to render
 * against a null company.
 */
export function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const user = useAuthStore((s) => s.user)
  const companies = useAuthStore((s) => s.companies)
  const isPlatformAdmin = companies.length === 0

  // Skip the company-scoped calls entirely for a platform admin.
  const partners = usePartnersCount(!isPlatformAdmin)
  const users = useUsersCount(!isPlatformAdmin)
  const accounts = useAccountsCount(!isPlatformAdmin)

  if (isPlatformAdmin) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          {t('platformAdmin.title')}
        </h1>
        <p className="mt-2 text-text-secondary">{t('platformAdmin.body')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        {user?.firstName
          ? t('welcome', { name: user.firstName })
          : t('welcomeGeneric')}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t('cards.partners')}
          icon={Users}
          value={partners.data}
          isLoading={partners.isLoading}
          isError={partners.isError}
        />
        <StatCard
          label={t('cards.users')}
          icon={UsersRound}
          value={users.data}
          isLoading={users.isLoading}
          isError={users.isError}
        />
        <StatCard
          label={t('cards.accounts')}
          icon={BookOpen}
          value={accounts.data}
          isLoading={accounts.isLoading}
          isError={accounts.isError}
        />
      </div>
    </div>
  )
}
