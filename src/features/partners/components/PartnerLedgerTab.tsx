import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/common/DataTable'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney } from '@/lib/format'
import { usePartnerBalance } from '@/features/partners/hooks/usePartnerBalance'
import { usePartnerTransactions } from '@/features/partners/hooks/usePartnerTransactions'
import type {
  PartnerBaseCurrencyBalance,
  PartnerCurrencyBalance,
  PartnerTransaction,
} from '@/features/partners/types/partners.types'

/**
 * §3's Partner Detail → Ledger tab. Split out of PartnerDetailPage since it
 * owns its own query state (the "As of" date re-querying the balance).
 * Expect this to render mostly empty — no Invoicing yet to generate real
 * postings, see src/mocks/db.ts's partnerTransactionsDb comment.
 */
export function PartnerLedgerTab({ partnerId }: { partnerId: string }) {
  const { t, i18n } = useTranslation('partners')
  const [asOf, setAsOf] = useState('')
  // Rows carry their own currency code; the summary cards now name their base
  // currency in the payload (baseCurrency), so we only look up decimal places.
  const currency = useCurrencyLookup()
  const balance = usePartnerBalance(partnerId, asOf || undefined)
  const transactions = usePartnerTransactions(partnerId, { page: 1, limit: 50 })

  const currencyColumns: ColumnDef<PartnerCurrencyBalance>[] = [
    { accessorKey: 'currency', header: t('detail.ledger.currency') },
    {
      accessorKey: 'debit',
      header: t('detail.ledger.columns.debit'),
      cell: ({ row }) => formatMoney(row.original.debit, currency(row.original.currency), i18n.language),
    },
    {
      accessorKey: 'credit',
      header: t('detail.ledger.columns.credit'),
      cell: ({ row }) => formatMoney(row.original.credit, currency(row.original.currency), i18n.language),
    },
    {
      accessorKey: 'net',
      header: t('detail.ledger.netBalance'),
      cell: ({ row }) => formatMoney(row.original.net, currency(row.original.currency), i18n.language),
    },
  ]

  const columns: ColumnDef<PartnerTransaction>[] = [
    {
      accessorKey: 'date',
      header: t('detail.ledger.columns.date'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
    },
    {
      accessorKey: 'entryNumber',
      header: t('detail.ledger.columns.entryNumber'),
      cell: ({ getValue }) => (getValue() as string | null) ?? '—',
    },
    {
      accessorKey: 'reference',
      header: t('detail.ledger.columns.reference'),
      cell: ({ getValue }) => (getValue() as string | null) ?? '—',
    },
    {
      accessorKey: 'description',
      header: t('detail.ledger.columns.description'),
      cell: ({ getValue }) => (getValue() as string | null) ?? '—',
    },
    {
      accessorKey: 'accountId',
      header: t('detail.ledger.columns.account'),
    },
    {
      id: 'debit',
      header: t('detail.ledger.columns.debit'),
      cell: ({ row }) =>
        row.original.side === 'DEBIT'
          ? formatMoney(
              row.original.amountOriginal,
              currency(row.original.currency),
              i18n.language
            )
          : '—',
    },
    {
      id: 'credit',
      header: t('detail.ledger.columns.credit'),
      cell: ({ row }) =>
        row.original.side === 'CREDIT'
          ? formatMoney(
              row.original.amountOriginal,
              currency(row.original.currency),
              i18n.language
            )
          : '—',
    },
  ]

  // Uniform base currency → one figure; mixed base → one figure per currency
  // (never summed), sourced from byBaseCurrency.
  const showBase = (
    scalar: number | null | undefined,
    pick: (r: PartnerBaseCurrencyBalance) => number
  ): string => {
    if (!balance.data) return '—'
    const b = balance.data
    if (scalar != null)
      return formatMoney(
        scalar,
        b.baseCurrency ? currency(b.baseCurrency) : undefined,
        i18n.language
      )
    return b.byBaseCurrency
      .map((r) => formatMoney(pick(r), currency(r.currency), i18n.language))
      .join(' · ')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-4 sm:grid-cols-3 sm:flex-1">
          <SummaryCard
            label={t('detail.ledger.totalDebit')}
            value={showBase(balance.data?.totalDebitBase, (r) => r.totalDebitBase)}
          />
          <SummaryCard
            label={t('detail.ledger.totalCredit')}
            value={showBase(
              balance.data?.totalCreditBase,
              (r) => r.totalCreditBase
            )}
          />
          <SummaryCard
            label={t('detail.ledger.netBalance')}
            value={showBase(balance.data?.balanceBase, (r) => r.balanceBase)}
            emphasize
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ledger-as-of" className="field-label">
            {t('detail.ledger.asOf')}
          </Label>
          <div className="field-box">
            <Input
              id="ledger-as-of"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!!balance.data?.byCurrency.length && (
        <DataTable columns={currencyColumns} data={balance.data.byCurrency} />
      )}

      {transactions.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={transactions.data?.data ?? []}
          emptyState={t('detail.ledger.transactionsEmpty')}
        />
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-card">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p
        className={
          emphasize
            ? 'mt-3 font-display text-2xl font-bold text-text-primary'
            : 'mt-3 font-display text-xl font-semibold text-text-primary'
        }
      >
        {value}
      </p>
    </div>
  )
}
