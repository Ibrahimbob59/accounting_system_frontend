import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountBadges } from '@/features/accounts/components/AccountBadges'
import { useAccount } from '@/features/accounts/hooks/useAccount'
import { useAccountBalance } from '@/features/accounts/hooks/useAccountBalance'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import { useUpdateAccount } from '@/features/accounts/hooks/useUpdateAccount'
import { useDeleteAccount } from '@/features/accounts/hooks/useDeleteAccount'
import { localizedAccountName } from '@/features/accounts/types/accounts.types'
import { isPermissionDenied, usePermission } from '@/features/auth/lib/permissions'
import { useBaseCurrency } from '@/features/companies/hooks/useBaseCurrency'
import { formatMoney } from '@/lib/format'
import { confirm, toast } from '@/lib/swal'
import { ApiException } from '@/types/api'

export function AccountDetailPage() {
  const { t, i18n } = useTranslation('accounts')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [asOf, setAsOf] = useState('')

  const { data: account, isLoading, isError, error } = useAccount(id)
  const balance = useAccountBalance(id, asOf)
  const allAccounts = useAllAccounts()
  // Balance amounts are plain numbers in the company's base currency — the
  // code and decimal places have to come from settings + the registry.
  const baseCurrency = useBaseCurrency()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()
  const canUpdate = usePermission('account.update')
  const canDelete = usePermission('account.delete')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !account) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const parent = allAccounts.data?.find((a) => a.id === account.parentId)

  const handleToggleActive = () => {
    updateAccount.mutate(
      { id: account.id, dto: { isActive: !account.isActive } },
      {
        onSuccess: () =>
          toast(
            'success',
            account.isActive ? t('detail.deactivated') : t('detail.activated')
          ),
        onError: (err) =>
          toast(
            'error',
            isPermissionDenied(err)
              ? t('errors.permissionDenied')
              : t('errors.generic')
          ),
      }
    )
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('detail.deleteConfirm.title'),
      description: t('detail.deleteConfirm.body', { number: account.number }),
      confirmLabel: t('detail.deleteConfirm.confirm'),
      cancelLabel: t('detail.deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!confirmed) return
    deleteAccount.mutate(account.id, {
      onSuccess: () => {
        toast('success', t('detail.deleted'))
        navigate('/app/accounts')
      },
      onError: (err) => {
        // The backend refuses to delete an account that still has children.
        // That's a specific, fixable situation — telling the user "something
        // went wrong" would hide the one thing they need to do first.
        const hasChildren =
          err instanceof ApiException && err.code === 'ACCOUNT_HAS_CHILDREN'
        toast(
          'error',
          hasChildren
            ? t('detail.deleteBlocked')
            : isPermissionDenied(err)
              ? t('errors.permissionDenied')
              : t('errors.generic')
        )
      },
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/accounts"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            <span className="font-mono">{account.number}</span>
            {' — '}
            {localizedAccountName(account, i18n.language)}
          </h1>
          <AccountBadges account={account} />
        </div>

        <div className="flex flex-wrap gap-2">
          {canUpdate && (
            <>
              <Button variant="outline" asChild>
                <Link to={`/app/accounts/${account.id}/edit`}>
                  <Pencil className="size-4" />
                  {t('detail.actions.edit')}
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleActive}
                disabled={updateAccount.isPending}
              >
                {account.isActive
                  ? t('detail.actions.deactivate')
                  : t('detail.actions.activate')}
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleteAccount.isPending}
            >
              <Trash2 className="size-4" />
              {t('detail.actions.delete')}
            </Button>
          )}
        </div>
      </div>

      {/* All three names shown explicitly — the tree and list can only fit one,
          so this is the single place the full trilingual record is visible. */}
      <Section title={t('form.sections.identity')}>
        <InfoRow label={t('form.name')} value={account.name} />
        <InfoRow
          label={t('form.nameAr')}
          value={account.nameAr ?? t('detail.notSet')}
          dir={account.nameAr ? 'rtl' : undefined}
        />
        <InfoRow
          label={t('form.nameFr')}
          value={account.nameFr ?? t('detail.notSet')}
        />
        <InfoRow
          label={t('form.nameEn')}
          value={account.nameEn ?? t('detail.notSet')}
        />
      </Section>

      <Section title={t('form.sections.classification')}>
        <InfoRow label={t('form.accountClass')} value={account.accountClass} />
        <InfoRow label={t('form.type')} value={t(`type.${account.type}`)} />
        <InfoRow
          label={t('form.normalBalance')}
          value={t(`normalBalance.${account.normalBalance}`)}
        />
        <InfoRow
          label={t('form.parent')}
          value={
            parent
              ? `${parent.number} — ${localizedAccountName(parent, i18n.language)}`
              : t('detail.noParent')
          }
        />
        <InfoRow
          label={t('form.currencyRestriction')}
          value={account.currencyRestriction ?? t('detail.anyCurrency')}
        />
        <InfoRow
          label={t('form.controlType')}
          value={
            account.isControl && account.controlType
              ? t(`controlType.${account.controlType}`)
              : t('detail.notControl')
          }
        />
      </Section>

      <Section title={t('detail.balance.title')}>
        <div className="col-span-full max-w-56 space-y-2">
          <Label htmlFor="account-as-of" className="field-label">
            {t('detail.balance.asOf')}
          </Label>
          <div className="field-box">
            <Input
              id="account-as-of"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
        </div>

        {balance.isLoading ? (
          <div className="col-span-full flex py-4">
            <Loader2 className="size-5 animate-spin text-brand" />
          </div>
        ) : balance.isError || !balance.data ? (
          <p className="col-span-full text-sm text-text-muted">
            {t('detail.balance.unavailable')}
          </p>
        ) : (
          <>
            <InfoRow
              label={t('detail.balance.totalDebit')}
              value={formatMoney(
                balance.data.totalDebitBase,
                baseCurrency,
                i18n.language
              )}
            />
            <InfoRow
              label={t('detail.balance.totalCredit')}
              value={formatMoney(
                balance.data.totalCreditBase,
                baseCurrency,
                i18n.language
              )}
            />
            {/* naturalBalance, not balance: it's already flipped so a normal-side
                balance reads positive, which is what an accountant expects. */}
            <InfoRow
              label={t('detail.balance.balance')}
              value={formatMoney(
                balance.data.naturalBalance,
                baseCurrency,
                i18n.language
              )}
            />
          </>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-bold text-text-primary">
        {title}
      </h2>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function InfoRow({
  label,
  value,
  dir,
}: {
  label: string
  value: ReactNode
  dir?: 'rtl'
}) {
  return (
    <div>
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd dir={dir} className="mt-0.5 text-[15px] text-text-primary">
        {value}
      </dd>
    </div>
  )
}
