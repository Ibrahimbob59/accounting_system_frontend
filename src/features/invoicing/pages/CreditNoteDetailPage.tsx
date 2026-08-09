import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink, Loader2, Send, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InvoiceStatusBadge } from '@/features/invoicing/components/InvoiceStatusBadge'
import {
  useCreditNote,
  useConfirmCreditNote,
  useDeleteCreditNote,
} from '@/features/invoicing/hooks/useCreditNotes'
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

export function CreditNoteDetailPage() {
  const { t, i18n } = useTranslation('invoicing')
  const lang = i18n.language
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: cn, isLoading, isError, error } = useCreditNote(id)
  const partners = useAllPartners()
  const allItems = useAllItems()
  const lookupCurrency = useCurrencyLookup()
  const companyBase = useActiveCompanyBaseCurrency()

  const confirmCn = useConfirmCreditNote()
  const deleteCn = useDeleteCreditNote()
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

  if (isError || !cn) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const dash = t('detail.notSet')
  const currency = lookupCurrency(cn.currencyCode)
  const baseCurrency = companyBase ? lookupCurrency(companyBase) : undefined
  const money = (n: number) => formatMoney(n, currency, lang)
  const moneyBase = (n: number) => formatMoney(n, baseCurrency, lang)

  const customer =
    partners.data?.find((p) => p.id === cn.customerId)?.name ??
    cn.customerId.slice(0, 8)
  const itemName = (itemId: string) => {
    const item = allItems.data?.find((i) => i.id === itemId)
    return item
      ? `${item.code} — ${localizedItemName(item, lang)}`
      : itemId.slice(0, 8)
  }

  const isDraft = cn.status === 'DRAFT'
  const busy = posting || deleteCn.isPending

  const handleConfirm = async () => {
    const ok = await confirm({
      title: t('credit.confirmDialog.title'),
      description: t('credit.confirmDialog.body'),
      confirmLabel: t('actions.confirmDialog.confirm'),
      cancelLabel: t('actions.confirmDialog.cancel'),
    })
    if (!ok) return
    setPosting(true)
    confirmCn.mutate(cn.id, {
      onSuccess: () => toast('success', t('credit.posted')),
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
    deleteCn.mutate(cn.id, {
      onSuccess: () => {
        toast('success', t('actions.deleted'))
        navigate('/app/credit-notes')
      },
      onError: (err) => toast('error', invoicingErrorMessage(err, t)),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/credit-notes"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('credit.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            <span className="font-mono">{cn.creditNoteNo}</span>
          </h1>
          <InvoiceStatusBadge status={cn.status} />
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
          label={t('credit.date')}
          value={formatDate(cn.creditNoteDate, lang)}
        />
        <InfoRow
          label={t('credit.againstInvoice')}
          value={
            cn.salesInvoiceId ? (
              <Link
                to={`/app/sales-invoices/${cn.salesInvoiceId}`}
                className="inline-flex items-center gap-1 text-brand hover:underline"
              >
                {t('credit.viewInvoice')}
                <ExternalLink className="size-3.5" />
              </Link>
            ) : (
              dash
            )
          }
        />
        <InfoRow
          label={t('detail.currency')}
          value={
            cn.currencyCode === companyBase
              ? cn.currencyCode
              : `${cn.currencyCode} @ ${cn.rate}`
          }
        />
        <InfoRow label={t('credit.reason')} value={cn.reason ?? dash} />
        <InfoRow label={t('detail.notes')} value={cn.notes ?? dash} />
        {cn.journalEntryId && (
          <InfoRow
            label={t('detail.journalEntry')}
            value={
              <Link
                to={`/app/journal-entries/${cn.journalEntryId}`}
                className="inline-flex items-center gap-1 text-brand hover:underline"
              >
                {t('detail.viewEntry')}
                <ExternalLink className="size-3.5" />
              </Link>
            }
          />
        )}
        {cn.postedAt && (
          <InfoRow
            label={t('detail.postedAt')}
            value={formatDate(cn.postedAt, lang)}
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
              {[...cn.lines]
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
          value={money(cn.subtotal)}
        />
        <TotalRow label={t('detail.totals.vat')} value={money(cn.vatTotal)} />
        <TotalRow
          label={t('detail.totals.grand')}
          value={money(cn.grandTotal)}
          strong
        />
        {cn.currencyCode !== companyBase && (
          <p className="pt-1 text-[13px] text-text-muted">
            {t('detail.totals.baseNote', {
              currency: companyBase ?? '—',
              amount: moneyBase(cn.grandTotalBase),
            })}
          </p>
        )}
        <p className="text-[13px] text-text-muted">
          {t('detail.totals.cogs', { amount: moneyBase(cn.cogsTotalBase) })}
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
