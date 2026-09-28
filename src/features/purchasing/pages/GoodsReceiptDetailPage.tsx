import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'

import { useGoodsReceipt } from '@/features/purchasing/hooks/useGoodsReceipts'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { localizedItemName } from '@/features/items/types/items.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'

export function GoodsReceiptDetailPage() {
  const { t, i18n } = useTranslation('purchasing')
  const lang = i18n.language
  const { id } = useParams<{ id: string }>()

  const { data: receipt, isLoading, isError, error } = useGoodsReceipt(id)
  const allItems = useAllItems()
  const companyBase = useActiveCompanyBaseCurrency()
  const lookupCurrency = useCurrencyLookup()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }
  if (isError || !receipt) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const baseCurrency = companyBase ? lookupCurrency(companyBase) : undefined
  const moneyBase = (n: number) => formatMoney(n, baseCurrency, lang)
  const itemName = (itemId: string) => {
    const item = allItems.data?.find((i) => i.id === itemId)
    return item
      ? `${item.code} — ${localizedItemName(item, lang)}`
      : itemId.slice(0, 8)
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/goods-receipts"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('receipt.detail.back')}
      </Link>

      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        <span className="font-mono">{receipt.receiptNo}</span>
      </h1>

      <section className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <InfoRow
          label={t('receipt.detail.date')}
          value={formatDate(receipt.receiptDate, lang)}
        />
        <InfoRow
          label={t('receipt.detail.purchaseOrder')}
          value={
            <Link
              to={`/app/purchase-orders/${receipt.purchaseOrderId}`}
              className="inline-flex items-center gap-1 text-brand hover:underline"
            >
              {t('receipt.detail.viewPO')}
              <ExternalLink className="size-3.5" />
            </Link>
          }
        />
        <InfoRow
          label={t('receipt.detail.notes')}
          value={receipt.notes ?? t('receipt.detail.notSet')}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('receipt.detail.sections.lines')}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('receipt.detail.lines.item')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('receipt.detail.lines.qty')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('receipt.detail.lines.unitCost')}
                </th>
              </tr>
            </thead>
            <tbody>
              {receipt.lines.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-2.5">{itemName(l.itemId)}</td>
                  <td className="px-4 py-2.5 text-end font-mono">
                    {l.qtyReceived}
                  </td>
                  <td className="px-4 py-2.5 text-end font-mono">
                    {moneyBase(l.unitCostBase)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
