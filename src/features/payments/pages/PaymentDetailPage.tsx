import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Ban, ExternalLink, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PaymentStatusBadge } from '@/features/payments/components/PaymentStatusBadge'
import { usePayment } from '@/features/payments/hooks/usePayments'
import { useVoidPayment } from '@/features/payments/hooks/usePaymentMutations'
import { paymentsErrorMessage } from '@/features/payments/lib/payments-errors'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'
import { confirm, toast } from '@/lib/swal'

export function PaymentDetailPage() {
  const { t, i18n } = useTranslation('payments')
  const lang = i18n.language
  const { id } = useParams<{ id: string }>()

  const { data: payment, isLoading, isError, error } = usePayment(id)
  const partners = useAllPartners()
  const accounts = useAllAccounts()
  const lookupCurrency = useCurrencyLookup()

  const voidPayment = useVoidPayment()
  const [voiding, setVoiding] = useState(false)
  const canVoid = usePermission('payment.void')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !payment) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const dash = t('detail.notSet')
  const currency = lookupCurrency(payment.currencyCode)
  const baseCurrency = lookupCurrency(payment.baseCurrencyCode)
  const money = (n: number) => formatMoney(n, currency, lang)
  const moneyBase = (n: number) => formatMoney(n, baseCurrency, lang)

  const partnerName =
    partners.data?.find((p) => p.id === payment.partnerId)?.name ??
    payment.partnerId.slice(0, 8)
  const cashAccount = accounts.data?.find((a) => a.id === payment.cashAccountId)
  const cashAccountLabel = cashAccount
    ? `${cashAccount.number} — ${cashAccount.name}`
    : payment.cashAccountId.slice(0, 8)

  const isPosted = payment.status === 'POSTED'

  const handleVoid = async () => {
    const ok = await confirm({
      title: t('actions.voidDialog.title'),
      description: t('actions.voidDialog.body'),
      confirmLabel: t('actions.voidDialog.confirm'),
      cancelLabel: t('actions.voidDialog.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    setVoiding(true)
    voidPayment.mutate(payment.id, {
      onSuccess: () => toast('success', t('actions.voided')),
      onError: (err) => toast('error', paymentsErrorMessage(err, t)),
      onSettled: () => setVoiding(false),
    })
  }

  const docHref = (documentType: string, documentId: string) =>
    documentType === 'SALES_INVOICE'
      ? `/app/sales-invoices/${documentId}`
      : null

  return (
    <div className="space-y-6">
      <Link
        to="/app/payments"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            <span className="font-mono">{payment.paymentNo}</span>
          </h1>
          <PaymentStatusBadge status={payment.status} />
        </div>

        {isPosted && canVoid && (
          <Button
            variant="destructive"
            onClick={() => void handleVoid()}
            disabled={voiding}
          >
            <Ban className="size-4" />
            {t('actions.void')}
          </Button>
        )}
      </div>

      <Section title={t('detail.sections.details')}>
        <InfoRow
          label={t('detail.direction')}
          value={t(`direction.${payment.direction}`)}
        />
        <InfoRow
          label={
            payment.direction === 'IN' ? t('form.customer') : t('form.supplier')
          }
          value={partnerName}
        />
        <InfoRow label={t('detail.cashAccount')} value={cashAccountLabel} />
        <InfoRow
          label={t('detail.method')}
          value={t(`method.${payment.method}`)}
        />
        <InfoRow
          label={t('detail.paymentDate')}
          value={formatDate(payment.paymentDate, lang)}
        />
        <InfoRow
          label={t('detail.currency')}
          value={
            payment.currencyCode === payment.baseCurrencyCode
              ? payment.currencyCode
              : `${payment.currencyCode} @ ${payment.rate}`
          }
        />
        <InfoRow
          label={t('detail.amount')}
          value={money(payment.amountOriginal)}
        />
        {payment.currencyCode !== payment.baseCurrencyCode && (
          <InfoRow
            label={t('detail.amountBase', {
              currency: payment.baseCurrencyCode,
            })}
            value={moneyBase(payment.amountBase)}
          />
        )}
        <InfoRow
          label={t('detail.reference')}
          value={payment.reference ?? dash}
        />
        <InfoRow label={t('detail.notes')} value={payment.notes ?? dash} />
        {payment.journalEntryId && (
          <InfoRow
            label={t('detail.journalEntry')}
            value={
              <Link
                to={`/app/journal-entries/${payment.journalEntryId}`}
                className="inline-flex items-center gap-1 text-brand hover:underline"
              >
                {t('detail.viewEntry')}
                <ExternalLink className="size-3.5" />
              </Link>
            }
          />
        )}
        {payment.voidedAt && (
          <InfoRow
            label={t('detail.voidedAt')}
            value={formatDate(payment.voidedAt, lang)}
          />
        )}
      </Section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('detail.sections.allocations')}
        </h2>
        {payment.allocations.length === 0 ? (
          <p className="text-[14px] text-text-muted">
            {t('detail.onAccountAll')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                  <th className="px-4 py-2.5 font-medium">
                    {t('detail.alloc.document')}
                  </th>
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t('detail.alloc.amount')}
                  </th>
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t('detail.alloc.amountBase')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payment.allocations.map((a) => {
                  const href = docHref(a.documentType, a.documentId)
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] text-text-muted">
                          {t(`documentType.${a.documentType}`, {
                            defaultValue: a.documentType,
                          })}
                        </span>
                        <br />
                        {href ? (
                          <Link
                            to={href}
                            className="inline-flex items-center gap-1 font-mono text-[13px] text-brand hover:underline"
                          >
                            {a.documentId.slice(0, 8)}
                            <ExternalLink className="size-3.5" />
                          </Link>
                        ) : (
                          <span className="font-mono text-[13px]">
                            {a.documentId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-end font-mono">
                        {money(a.amountOriginal)}
                      </td>
                      <td className="px-4 py-2.5 text-end font-mono text-text-muted">
                        {moneyBase(a.amountBase)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
