import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Loader2, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/common/StatusBadge'
import { CompanySettingsForm } from '@/features/companies/components/CompanySettingsForm'
import { useCompany } from '@/features/companies/hooks/useCompany'
import { useCompanySettings } from '@/features/companies/hooks/useCompanySettings'
import { useDeleteCompany } from '@/features/companies/hooks/useDeleteCompany'
import { monthName } from '@/features/companies/types/companies.types'
import { useSwitchCompany } from '@/features/auth/hooks/useSwitchCompany'
import { completeAuth } from '@/features/auth/lib/complete-auth'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { isPermissionDenied, usePermission } from '@/features/auth/lib/permissions'
import { confirm, toast } from '@/lib/swal'

export function CompanyDetailPage() {
  const { t, i18n } = useTranslation('companies')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: company, isLoading, isError, error } = useCompany(id)
  const settings = useCompanySettings(id)
  const deleteCompany = useDeleteCompany()
  const switchCompany = useSwitchCompany()
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId)
  const canUpdate = usePermission('company.update')
  const canDelete = usePermission('company.delete')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !company) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const isActiveCompany = company.id === activeCompanyId

  // Mirrors SelectCompanyPage: the response is a fresh AuthResponse whose
  // token is scoped to the new company, so it has to go through completeAuth
  // to be applied — mutating alone would leave the old company active.
  const handleSwitch = () => {
    switchCompany.mutate(
      { companyId: company.id },
      {
        onSuccess: (auth) => void completeAuth(auth, navigate),
        onError: () => toast('error', t('errors.generic')),
      }
    )
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('detail.deleteConfirm.title'),
      description: t('detail.deleteConfirm.body', { name: company.name }),
      confirmLabel: t('detail.deleteConfirm.confirm'),
      cancelLabel: t('detail.deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!confirmed) return
    deleteCompany.mutate(company.id, {
      onSuccess: () => {
        toast('success', t('detail.deleted'))
        navigate('/app/companies')
      },
      onError: (err) =>
        toast(
          'error',
          isPermissionDenied(err)
            ? t('errors.permissionDenied')
            : t('errors.generic')
        ),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/companies"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {company.name}
          </h1>
          {isActiveCompany && (
            <StatusBadge variant="success">
              <Check className="size-3" />
              {t('active')}
            </StatusBadge>
          )}
          {!company.isActive && (
            <StatusBadge variant="neutral">{t('status.inactive')}</StatusBadge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Switching from here saves a trip through /select-company, and is
              the natural next action after looking at a company you're not in. */}
          {!isActiveCompany && (
            <Button
              variant="outline"
              onClick={handleSwitch}
              disabled={switchCompany.isPending}
            >
              {switchCompany.isPending && <Loader2 className="animate-spin" />}
              {t('detail.actions.switchTo')}
            </Button>
          )}
          {canUpdate && (
            <Button variant="outline" asChild>
              <Link to={`/app/companies/${company.id}/edit`}>
                <Pencil className="size-4" />
                {t('detail.actions.edit')}
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleteCompany.isPending}
            >
              <Trash2 className="size-4" />
              {t('detail.actions.delete')}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 border-b border-border p-0"
        >
          <TabsTrigger value="profile" className="flex-none px-1 py-2.5">
            {t('tabs.profile')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-none px-1 py-2.5">
            {t('tabs.settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-6">
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <InfoRow label={t('form.name')} value={company.name} />
            <InfoRow
              label={t('form.taxNumber')}
              value={company.taxNumber ?? t('detail.notSet')}
            />
            <InfoRow
              label={t('form.phone')}
              value={company.phone ?? t('detail.notSet')}
            />
            <InfoRow
              label={t('form.email')}
              value={company.email ?? t('detail.notSet')}
            />
            <InfoRow
              label={t('form.baseCurrency')}
              value={company.baseCurrencyCode}
            />
            <InfoRow
              label={t('form.fiscalYearStart')}
              value={monthName(company.fiscalYearStartMonth, i18n.language)}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="pt-6">
          {settings.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-brand" />
            </div>
          ) : settings.isError || !settings.data ? (
            <p className="text-text-muted">
              {isPermissionDenied(settings.error)
                ? t('errors.permissionDeniedSection')
                : t('errors.generic')}
            </p>
          ) : (
            <CompanySettingsForm
              companyId={company.id}
              settings={settings.data}
              disabled={!canUpdate}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-text-primary">{value}</dd>
    </div>
  )
}
