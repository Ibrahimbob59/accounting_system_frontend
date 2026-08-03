import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PartnerTypeBadges } from '@/features/partners/components/PartnerTypeBadges'
import { PartnerLedgerTab } from '@/features/partners/components/PartnerLedgerTab'
import { usePartner } from '@/features/partners/hooks/usePartner'
import { useUpdatePartner } from '@/features/partners/hooks/useUpdatePartner'
import { useDeletePartner } from '@/features/partners/hooks/useDeletePartner'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import { confirm, toast } from '@/lib/swal'

export function PartnerDetailPage() {
  const { t } = useTranslation('partners')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: partner, isLoading } = usePartner(id)
  const accounts = useAllAccounts()
  const updatePartner = useUpdatePartner()
  const deletePartner = useDeletePartner()

  if (isLoading || !partner) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  const accountLabel = (accountId: string | null) => {
    if (!accountId) return t('detail.info.notSet')
    const account = accounts.data?.find((a) => a.id === accountId)
    return account ? `${account.number} — ${account.name}` : accountId
  }

  function handleToggleActive() {
    if (!partner) return
    updatePartner.mutate(
      { id: partner.id, dto: { isActive: !partner.isActive } },
      {
        onSuccess: () => {
          toast(
            'success',
            partner.isActive ? t('detail.toasts.deactivated') : t('detail.toasts.activated')
          )
        },
        onError: () => toast('error', t('errors.generic')),
      }
    )
  }

  async function handleDelete() {
    if (!partner) return
    const confirmed = await confirm({
      title: t('detail.deleteConfirm.title'),
      description: t('detail.deleteConfirm.body', { name: partner.name }),
      confirmLabel: t('detail.deleteConfirm.confirm'),
      cancelLabel: t('detail.deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!confirmed) return
    deletePartner.mutate(partner.id, {
      onSuccess: () => {
        toast('success', t('detail.toasts.deleted'))
        navigate('/app/partners')
      },
      onError: () => toast('error', t('errors.generic')),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/partners"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
              {partner.ref} — {partner.name}
            </h1>
            <PartnerTypeBadges isCustomer={partner.isCustomer} isSupplier={partner.isSupplier} />
            {partner.vip && (
              <StatusBadge variant="warning">{t('list.columns.vipBadge')}</StatusBadge>
            )}
            {partner.isActive ? (
              <StatusBadge variant="success">{t('list.columns.active')}</StatusBadge>
            ) : (
              <StatusBadge variant="neutral">{t('list.columns.inactive')}</StatusBadge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to={`/app/partners/${partner.id}/edit`}>
              <Pencil className="size-4" />
              {t('detail.actions.edit')}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleActive}
            disabled={updatePartner.isPending}
          >
            {partner.isActive
              ? t('detail.actions.deactivate')
              : t('detail.actions.activate')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePartner.isPending}
          >
            <Trash2 className="size-4" />
            {t('detail.actions.delete')}
          </Button>
        </div>
      </div>

      {/* `line` variant + a rule on the list itself: the active tab's
          underline sits ON that rule rather than floating above it. */}
      <Tabs defaultValue="info">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 border-b border-border p-0"
        >
          <TabsTrigger value="info" className="flex-none px-1 py-2.5">
            {t('detail.tabs.info')}
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex-none px-1 py-2.5">
            {t('detail.tabs.addresses')}
          </TabsTrigger>
          <TabsTrigger value="ledger" className="flex-none px-1 py-2.5">
            {t('detail.tabs.ledger')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-7 pt-6">
          <InfoSection title={t('form.sections.identity')}>
            <InfoRow label={t('form.name')} value={partner.name} />
            <InfoRow label={t('form.ref')} value={partner.ref} />
            <InfoRow label={t('form.category')} value={partner.category ?? t('detail.info.notSet')} />
            <InfoRow label={t('form.nameAr')} value={partner.nameAr ?? t('detail.info.notSet')} />
            <InfoRow label={t('form.nameFr')} value={partner.nameFr ?? t('detail.info.notSet')} />
            <InfoRow label={t('form.nameEn')} value={partner.nameEn ?? t('detail.info.notSet')} />
          </InfoSection>

          <InfoSection title={t('form.sections.contact')}>
            <InfoRow
              label={t('form.contactName')}
              value={partner.contactName ?? t('detail.info.notSet')}
            />
            <InfoRow label={t('form.email')} value={partner.email ?? t('detail.info.notSet')} />
            <InfoRow label={t('form.phone')} value={partner.phone ?? t('detail.info.notSet')} />
            <InfoRow label={t('form.phone2')} value={partner.phone2 ?? t('detail.info.notSet')} />
          </InfoSection>

          <InfoSection title={t('form.sections.financial')}>
            <InfoRow
              label={t('form.creditLimit')}
              value={
                partner.creditLimit != null
                  ? `${partner.creditLimit} ${partner.creditCurrency ?? ''}`.trim()
                  : t('detail.info.notSet')
              }
            />
            <InfoRow
              label={t('form.receivableAccount')}
              value={accountLabel(partner.receivableAccountId)}
            />
            <InfoRow
              label={t('form.payableAccount')}
              value={accountLabel(partner.payableAccountId)}
            />
          </InfoSection>
        </TabsContent>

        <TabsContent value="addresses" className="pt-6">
          {!partner.addresses?.length ? (
            <p className="text-text-muted">{t('detail.addresses.empty')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {partner.addresses.map((address) => (
                <div
                  key={address.id}
                  className="space-y-1 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {t(`form.addresses.type.${address.type}`)}
                    </span>
                    {address.isDefault && (
                      <StatusBadge variant="info">{t('detail.addresses.default')}</StatusBadge>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{address.line1}</p>
                  <p className="text-sm text-text-secondary">
                    {[address.city, address.region, address.country].filter(Boolean).join(', ') ||
                      t('detail.info.notSet')}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-text-secondary">{address.phone}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ledger" className="pt-6">
          <PartnerLedgerTab partnerId={partner.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-bold text-text-primary">{title}</h2>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-text-primary">{value}</dd>
    </div>
  )
}
