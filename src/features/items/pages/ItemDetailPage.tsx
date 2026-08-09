import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { StatusBadge } from '@/components/common/StatusBadge'
import { useItem } from '@/features/items/hooks/useItem'
import { localizedItemName } from '@/features/items/types/items.types'
import {
  useBrands,
  useFamilies,
  useItemCategories,
} from '@/features/catalog/hooks/useLookups'
import { localizedLookupName } from '@/features/catalog/types/catalog.types'
import { useUoms } from '@/features/uom/hooks/useUoms'
import { localizedUomName } from '@/features/uom/types/uom.types'
import { useTaxRates } from '@/features/taxes/hooks/useTaxRates'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import { localizedAccountName } from '@/features/accounts/types/accounts.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney } from '@/lib/format'

export function ItemDetailPage() {
  const { t, i18n } = useTranslation('items')
  const { id } = useParams<{ id: string }>()
  const lang = i18n.language

  const { data: item, isLoading, isError, error } = useItem(id)
  const categories = useItemCategories()
  const brands = useBrands()
  const families = useFamilies()
  const uoms = useUoms()
  const taxRates = useTaxRates()
  const accounts = useAllAccounts()
  const lookupCurrency = useCurrencyLookup()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !item) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const dash = t('detail.notSet')
  const lookupName = (
    list:
      | {
          id: string
          name: string
          nameAr: string | null
          nameFr: string | null
          nameEn: string | null
        }[]
      | undefined,
    lookupId: string | null
  ) => {
    if (!lookupId) return dash
    const found = list?.find((x) => x.id === lookupId)
    return found ? localizedLookupName(found, lang) : dash
  }
  const uomName = (uomId: string | null) => {
    if (!uomId) return dash
    const u = uoms.data?.find((x) => x.id === uomId)
    return u ? localizedUomName(u, lang) : dash
  }
  const accountName = (accountId: string | null) => {
    if (!accountId) return t('detail.accountDefault')
    const a = accounts.data?.find((x) => x.id === accountId)
    return a ? `${a.number} — ${localizedAccountName(a, lang)}` : dash
  }
  const taxRateName = (rateId: string | null) => {
    if (!rateId) return dash
    const r = taxRates.data?.find((x) => x.id === rateId)
    return r ? `${r.name} (${r.ratePct}%)` : dash
  }
  const money = (amount: number) =>
    formatMoney(amount, lookupCurrency(item.priceCurrency), lang)
  const yesNo = (v: boolean) => (v ? t('detail.yes') : t('detail.no'))

  return (
    <div className="space-y-6">
      <Link
        to="/app/items"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          <span className="font-mono">{item.code}</span>
          {' — '}
          {localizedItemName(item, lang)}
        </h1>
        {!item.trackInventory && (
          <StatusBadge variant="info">{t('badges.service')}</StatusBadge>
        )}
        {!item.isActive && (
          <StatusBadge variant="neutral">{t('status.inactive')}</StatusBadge>
        )}
      </div>

      <Section title={t('detail.sections.identity')}>
        <InfoRow label={t('form.name')} value={item.name} />
        <InfoRow
          label={t('form.nameAr')}
          value={item.nameAr ?? dash}
          dir={item.nameAr ? 'rtl' : undefined}
        />
        <InfoRow label={t('form.nameFr')} value={item.nameFr ?? dash} />
        <InfoRow label={t('form.nameEn')} value={item.nameEn ?? dash} />
        <InfoRow
          label={t('form.description')}
          value={item.description ?? dash}
        />
      </Section>

      <Section title={t('detail.sections.classification')}>
        <InfoRow
          label={t('form.category')}
          value={lookupName(categories.data, item.categoryId)}
        />
        <InfoRow
          label={t('form.brand')}
          value={lookupName(brands.data, item.brandId)}
        />
        <InfoRow
          label={t('form.family')}
          value={lookupName(families.data, item.familyId)}
        />
      </Section>

      <Section title={t('detail.sections.units')}>
        <InfoRow label={t('form.baseUom')} value={uomName(item.baseUomId)} />
        <InfoRow label={t('form.salesUom')} value={uomName(item.salesUomId)} />
        <InfoRow
          label={t('form.purchaseUom')}
          value={uomName(item.purchaseUomId)}
        />
      </Section>

      <Section title={t('detail.sections.pricing')}>
        <InfoRow label={t('form.costPrice')} value={money(item.costPrice)} />
        <InfoRow label={t('form.salePrice')} value={money(item.salePrice)} />
        <InfoRow label={t('form.priceCurrency')} value={item.priceCurrency} />
        <InfoRow
          label={t('form.vatTreatment')}
          value={t(`vatTreatment.${item.vatTreatment}`)}
        />
        <InfoRow
          label={t('form.defaultTaxRate')}
          value={taxRateName(item.defaultTaxRateId)}
        />
      </Section>

      <Section title={t('detail.sections.tracking')}>
        <InfoRow
          label={t('form.trackInventory')}
          value={yesNo(item.trackInventory)}
        />
        <InfoRow label={t('form.hasSize')} value={yesNo(item.hasSize)} />
        <InfoRow label={t('form.hasColour')} value={yesNo(item.hasColour)} />
        <InfoRow
          label={t('form.trackSerial')}
          value={yesNo(item.trackSerial)}
        />
        <InfoRow
          label={t('form.trackExpiry')}
          value={yesNo(item.trackExpiry)}
        />
      </Section>

      <Section title={t('detail.sections.accounting')}>
        <InfoRow
          label={t('form.revenueAccount')}
          value={accountName(item.revenueAccountId)}
        />
        <InfoRow
          label={t('form.cogsAccount')}
          value={accountName(item.cogsAccountId)}
        />
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
