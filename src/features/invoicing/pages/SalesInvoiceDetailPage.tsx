import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink, Loader2, Send, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InvoiceStatusBadge } from '@/features/invoicing/components/InvoiceStatusBadge'
import { useSalesInvoice } from '@/features/invoicing/hooks/useSalesInvoices'
import {
  useConfirmSalesInvoice,
  useDeleteSalesInvoice,
} from '@/features/invoicing/hooks/useSalesInvoiceMutations'
import { invoicingErrorMessage } from '@/features/invoicing/lib/invoicing-errors'
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

export function SalesInvoiceDetailPage() {
  const { t, i18n } = useTranslation('invoicing')
  const lang = i18n.language
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: invoice, isLoading, isError, error } = useSalesInvoice(id)
  const partners = useAllPartners()
  const allItems = useAllItems()
  const lookupCurrency = useCurrencyLookup()
  const companyBase = useActiveCompanyBaseCurrency()

  const confirmInvoice = useConfirmSalesInvoice()
  const deleteInvoice = useDeleteSalesInvoice()
  const [posting, setPosting] = useState(false)
  const canPost = usePermission('sales.post')
  const canDelete = usePermission('sales.delete')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const dash = t('detail.notSet')
  const currency = lookupCurrency(invoice.currencyCode)
  const baseCurrency = companyBase ? lookupCurrency(companyBase) : undefined
  const money = (n: number) => formatMoney(n, currency, lang)
  const moneyBase = (n: number) => formatMoney(n, baseCurrency, lang)

  const customer =
    partners.data?.find((p) => p.id === invoice.customerId)?.name ??
    invoice.customerId.slice(0, 8)
  const itemName = (itemId: string) => {
    const item = allItems.data?.find((i) => i.id === itemId)
    return item
      ? `${item.code} — ${localizedItemName(item, lang)}`
      : itemId.slice(0, 8)
  }

  const isDraft = invoice.status === 'DRAFT'
  const busy = posting || deleteInvoice.isPending

  const handleConfirm = async () => {
    const ok = await confirm({
      title: t('actions.confirmDialog.title'),
      description: t('actions.confirmDialog.body'),
      confirmLabel: t('actions.confirmDialog.confirm'),
      cancelLabel: t('actions.confirmDialog.cancel'),
    })
    if (!ok) return
    setPosting(true)
    confirmInvoice.mutate(invoice.id, {
      onSuccess: () => toast('success', t('actions.posted')),
      onError: (err) => toast('error', invoicingErrorMessage(err, t)),
      onSettled: () => setPosting(false),
    })
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('actions.deleteDialog.title'),
      description: t('actions.deleteDialog.body'),
      confirmLabel: t('actions.deleteDialog.confirm'),
      cancelLabel: t('actions.deleteDialog.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => {
        toast('success', t('actions.deleted'))
        navigate('/app/sales-invoices')
      },
      onError: (err) => toast('error', invoicingErrorMessage(err, t)),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/sales-invoices"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            <span className="font-mono">{invoice.invoiceNo}</span>
          </h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        {isDraft && (
          <div className="flex flex-wrap gap-2">
            {canPost && (
              <Button onClick={() => void handleConfirm()} disabled={busy}>
                <Send className="size-4" />
                {t('actions.confirm')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={busy}
              >
                <Trash2 className="size-4" />
                {t('actions.delete')}
              </Button>
            )}
          </div>
        )}
      </div>

      <Section title={t('detail.sections.details')}>
        <InfoRow label={t('detail.customer')} value={customer} />
        <InfoRow
          label={t('detail.invoiceDate')}
          value={formatDate(invoice.invoiceDate, lang)}
        />
        <InfoRow
          label={t('detail.dueDate')}
          value={invoice.dueDate ? formatDate(invoice.dueDate, lang) : dash}
        />
        <InfoRow
          label={t('detail.currency')}
          value={
            invoice.currencyCode === companyBase
              ? invoice.currencyCode
              : `${invoice.currencyCode} @ ${invoice.rate}`
          }
        />
        <InfoRow
          label={t('detail.customerRef')}
          value={invoice.customerRef ?? dash}
        />
        <InfoRow label={t('detail.notes')} value={invoice.notes ?? dash} />
        {invoice.journalEntryId && (
          <InfoRow
            label={t('detail.journalEntry')}
            value={
              <Link
                to={`/app/journal-entries/${invoice.journalEntryId}`}
                className="inline-flex items-center gap-1 text-brand hover:underline"
              >
                {t('detail.viewEntry')}
                <ExternalLink className="size-3.5" />
              </Link>
            }
          />
        )}
        {invoice.postedAt && (
          <InfoRow
            label={t('detail.postedAt')}
            value={formatDate(invoice.postedAt, lang)}
          />
        )}
      </Section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('detail.sections.lines')}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('detail.lines.item')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('detail.lines.qty')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('detail.lines.price')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('detail.lines.discount')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('detail.lines.net')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('detail.lines.vat')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('detail.lines.total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...invoice.lines]
                .sort((a, b) => a.lineNo - b.lineNo)
                .map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-text-primary">
                        {itemName(l.itemId)}
                      </span>
                      {l.description && (
                        <span className="block text-[12px] text-text-muted">
                          {l.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono">{l.qty}</td>
                    <td className="px-4 py-2.5 text-end font-mono">
                      {money(l.unitPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono text-text-muted">
                      {l.lineDiscountPct ? `${l.lineDiscountPct}%` : '—'}
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
          value={money(invoice.subtotal)}
        />
        <TotalRow
          label={t('detail.totals.vat')}
          value={money(invoice.vatTotal)}
        />
        <TotalRow
          label={t('detail.totals.grand')}
          value={money(invoice.grandTotal)}
          strong
        />
        {invoice.currencyCode !== companyBase && (
          <p className="pt-1 text-[13px] text-text-muted">
            {t('detail.totals.baseNote', {
              currency: companyBase ?? '—',
              amount: moneyBase(invoice.grandTotalBase),
            })}
          </p>
        )}
        <p className="text-[13px] text-text-muted">
          {t('detail.totals.cogs', {
            amount: moneyBase(invoice.cogsTotalBase),
          })}
        </p>
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
