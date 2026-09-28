import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink, Loader2, Send, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { VendorBillStatusBadge } from '@/features/purchasing/components/VendorBillStatusBadge'
import { useVendorBill } from '@/features/purchasing/hooks/useVendorBills'
import {
  useConfirmVendorBill,
  useDeleteVendorBill,
} from '@/features/purchasing/hooks/useVendorBills'
import { purchasingErrorMessage } from '@/features/purchasing/lib/purchasing-errors'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { localizedItemName } from '@/features/items/types/items.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { formatMoney, formatDate } from '@/lib/format'
import { confirm, toast } from '@/lib/swal'

export function VendorBillDetailPage() {
  const { t, i18n } = useTranslation('purchasing')
  const lang = i18n.language
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: bill, isLoading, isError, error } = useVendorBill(id)
  const partners = useAllPartners()
  const allItems = useAllItems()
  const lookupCurrency = useCurrencyLookup()
  const companyBase = useActiveCompanyBaseCurrency()

  const confirmBill = useConfirmVendorBill()
  const deleteBill = useDeleteVendorBill()
  const [posting, setPosting] = useState(false)
  const canPost = usePermission('purchase.post')
  const canDelete = usePermission('purchase.delete')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }
  if (isError || !bill) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const dash = t('bill.detail.notSet')
  const currency = lookupCurrency(bill.currencyCode)
  const baseCurrency = companyBase ? lookupCurrency(companyBase) : undefined
  const money = (n: number) => formatMoney(n, currency, lang)
  const moneyBase = (n: number) => formatMoney(n, baseCurrency, lang)

  const supplier =
    partners.data?.find((p) => p.id === bill.supplierId)?.name ??
    bill.supplierId.slice(0, 8)
  const itemName = (itemId: string) => {
    const item = allItems.data?.find((i) => i.id === itemId)
    return item
      ? `${item.code} — ${localizedItemName(item, lang)}`
      : itemId.slice(0, 8)
  }

  const isDraft = bill.status === 'DRAFT'
  const busy = posting || deleteBill.isPending

  const handleConfirm = async () => {
    const ok = await confirm({
      title: t('bill.actions.confirmDialog.title'),
      description: t('bill.actions.confirmDialog.body'),
      confirmLabel: t('bill.actions.confirmDialog.confirm'),
      cancelLabel: t('bill.actions.confirmDialog.cancel'),
    })
    if (!ok) return
    setPosting(true)
    confirmBill.mutate(bill.id, {
      onSuccess: () => toast('success', t('bill.actions.posted')),
      onError: (err) => toast('error', purchasingErrorMessage(err, t)),
      onSettled: () => setPosting(false),
    })
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('bill.actions.deleteDialog.title'),
      description: t('bill.actions.deleteDialog.body'),
      confirmLabel: t('bill.actions.deleteDialog.confirm'),
      cancelLabel: t('bill.actions.deleteDialog.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteBill.mutate(bill.id, {
      onSuccess: () => {
        toast('success', t('bill.actions.deleted'))
        navigate('/app/vendor-bills')
      },
      onError: (err) => toast('error', purchasingErrorMessage(err, t)),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/vendor-bills"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('bill.detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            <span className="font-mono">{bill.billNo}</span>
          </h1>
          <VendorBillStatusBadge status={bill.status} />
        </div>

        {isDraft && (
          <div className="flex flex-wrap gap-2">
            {canPost && (
              <Button onClick={() => void handleConfirm()} disabled={busy}>
                <Send className="size-4" />
                {t('bill.actions.confirm')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={busy}
              >
                <Trash2 className="size-4" />
                {t('bill.actions.delete')}
              </Button>
            )}
          </div>
        )}
      </div>

      <Section title={t('bill.detail.sections.details')}>
        <InfoRow label={t('bill.detail.supplier')} value={supplier} />
        <InfoRow
          label={t('bill.detail.billDate')}
          value={formatDate(bill.billDate, lang)}
        />
        <InfoRow
          label={t('bill.detail.dueDate')}
          value={bill.dueDate ? formatDate(bill.dueDate, lang) : dash}
        />
        <InfoRow
          label={t('bill.detail.currency')}
          value={
            bill.currencyCode === companyBase
              ? bill.currencyCode
              : `${bill.currencyCode} @ ${bill.rate}`
          }
        />
        <InfoRow
          label={t('bill.detail.supplierRef')}
          value={bill.supplierRef ?? dash}
        />
        <InfoRow label={t('bill.detail.notes')} value={bill.notes ?? dash} />
        {bill.purchaseOrderId && (
          <InfoRow
            label={t('bill.detail.purchaseOrder')}
            value={
              <Link
                to={`/app/purchase-orders/${bill.purchaseOrderId}`}
                className="inline-flex items-center gap-1 text-brand hover:underline"
              >
                {t('bill.detail.viewPO')}
                <ExternalLink className="size-3.5" />
              </Link>
            }
          />
        )}
        {bill.journalEntryId && (
          <InfoRow
            label={t('bill.detail.journalEntry')}
            value={
              <Link
                to={`/app/journal-entries/${bill.journalEntryId}`}
                className="inline-flex items-center gap-1 text-brand hover:underline"
              >
                {t('bill.detail.viewEntry')}
                <ExternalLink className="size-3.5" />
              </Link>
            }
          />
        )}
      </Section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('bill.detail.sections.lines')}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('bill.detail.lines.item')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('bill.detail.lines.qty')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('bill.detail.lines.cost')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('bill.detail.lines.net')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('bill.detail.lines.vat')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('bill.detail.lines.total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...bill.lines]
                .sort((a, b) => a.lineNo - b.lineNo)
                .map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-2.5">{itemName(l.itemId)}</td>
                    <td className="px-4 py-2.5 text-end font-mono">{l.qty}</td>
                    <td className="px-4 py-2.5 text-end font-mono">
                      {money(l.unitCost)}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono">
                      {money(l.netAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono text-text-muted">
                      {money(l.vatAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono text-text-primary">
                      {money(l.totalAmount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ms-auto max-w-sm space-y-2">
        <TotalRow
          label={t('detail.totals.subtotal')}
          value={money(bill.subtotal)}
        />
        <TotalRow label={t('detail.totals.vat')} value={money(bill.vatTotal)} />
        <TotalRow
          label={t('detail.totals.grand')}
          value={money(bill.grandTotal)}
          strong
        />
        {bill.currencyCode !== companyBase && (
          <p className="pt-1 text-[13px] text-text-muted">
            {t('bill.detail.totals.baseNote', {
              currency: companyBase ?? '—',
              amount: moneyBase(bill.grandTotalBase),
            })}
          </p>
        )}
      </section>
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

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-text-primary">{value}</dd>
    </div>
  )
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        strong
          ? 'border-t border-border pt-2 text-[16px] font-bold text-text-primary'
          : 'text-[14px] text-text-secondary'
      }`}
    >
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
