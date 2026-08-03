import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, ChevronRight, Loader2 } from 'lucide-react'

import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { FormBanner } from '@/components/common/FormBanner'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useSwitchCompany } from '@/features/auth/hooks/useSwitchCompany'
import { completeAuth } from '@/features/auth/lib/complete-auth'

export function SelectCompanyPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const companies = useAuthStore((s) => s.companies)
  const switchCompany = useSwitchCompany()
  const [banner, setBanner] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const onSelect = (companyId: string) => {
    setBanner(null)
    setPendingId(companyId)
    switchCompany.mutate(
      { companyId },
      {
        // Fresh AuthResponse with activeCompanyId now set → completeAuth
        // re-runs §2 and lands on /app in the normal case.
        onSuccess: (auth) => completeAuth(auth, navigate),
        onError: () => {
          // Only reachable with a stale/tampered request (the list only shows
          // the user's own companies), so a generic banner is enough.
          setBanner(t('selectCompany.errors.generic'))
          setPendingId(null)
        },
      }
    )
  }

  return (
    <AuthLayout
      title={t('selectCompany.title')}
      subtitle={t('selectCompany.subtitle')}
    >
      <div className="space-y-4">
        {banner && <FormBanner variant="error">{banner}</FormBanner>}

        <ul className="space-y-3">
          {companies.map((company) => {
            const isPending = pendingId === company.id
            return (
              <li key={company.id}>
                <button
                  type="button"
                  onClick={() => onSelect(company.id)}
                  disabled={switchCompany.isPending}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-4 text-start transition-colors hover:border-brand hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="icon-chip">
                    <Building2 className="size-4" />
                  </span>
                  <span className="flex-1 font-medium text-text-primary">
                    {company.name}
                  </span>
                  {isPending ? (
                    <Loader2 className="size-5 shrink-0 animate-spin text-text-muted" />
                  ) : (
                    <ChevronRight className="size-5 shrink-0 text-text-muted rtl:rotate-180" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </AuthLayout>
  )
}
