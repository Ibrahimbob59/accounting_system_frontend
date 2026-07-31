import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/common/DataTable'
import { usePartnerBalance } from '@/features/partners/hooks/usePartnerBalance'
import { usePartnerTransactions } from '@/features/partners/hooks/usePartnerTransactions'
import type {
  PartnerCurrencyBalance,
  PartnerTransaction,
} from '@/features/partners/types/partners.types'

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`
}

/**
 * §3's Partner Detail → Ledger tab. Split out of PartnerDetailPage since it
 * owns its own query state (the "As of" date re-querying the balance).
 * Expect this to render mostly empty — no Invoicing yet to generate real
 * postings, see src/mocks/db.ts's partnerTransactionsDb comment.
 */
export function PartnerLedgerTab({ partnerId }: { partnerId: string }) {
  const { t } = useTranslation('partners')
  const [asOf, setAsOf] = useState('')
  const balance = usePartnerBalance(partnerId, asOf || undefined)
  const transactions = usePartnerTransactions(partnerId, { page: 1, limit: 50 })

  const currencyColumns: ColumnDef<PartnerCurrencyBalance>[] = [
    { accessorKey: 'currency', header: t('detail.ledger.currency') },
    {
      accessorKey: 'debit',
      header: t('detail.ledger.columns.debit'),
      cell: ({ row }) => formatAmount(row.original.debit, row.original.currency),
    },
    {
      accessorKey: 'credit',
      header: t('detail.ledger.columns.credit'),
      cell: ({ row }) => formatAmount(row.original.credit, row.original.currency),
    },
    {
      accessorKey: 'net',
      header: t('detail.ledger.netBalance'),
      cell: ({ row }) => formatAmount(row.original.net, row.original.currency),
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
          ? formatAmount(row.original.amountOriginal, row.original.currency)
          : '—',
    },
    {
      id: 'credit',
      header: t('detail.ledger.columns.credit'),
      cell: ({ row }) =>
        row.original.side === 'CREDIT'
          ? formatAmount(row.original.amountOriginal, row.original.currency)
          : '—',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-4 sm:grid-cols-3 sm:flex-1">
          <SummaryCard
            label={t('detail.ledger.totalDebit')}
            value={balance.data ? formatAmount(balance.data.totalDebitBase, '') : '—'}
          />
          <SummaryCard
            label={t('detail.ledger.totalCredit')}
            value={balance.data ? formatAmount(balance.data.totalCreditBase, '') : '—'}
          />
          <SummaryCard
            label={t('detail.ledger.netBalance')}
            value={balance.data ? formatAmount(balance.data.balanceBase, '') : '—'}
            emphasize
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ledger-as-of" className="field-label">
            {t('detail.ledger.asOf')}
          </Label>
          <div className="field-line">
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
          <Loader2 className="size-6 animate-spin text-primary-700" />
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
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p
        className={
          emphasize
            ? 'mt-1 text-xl font-semibold text-text-primary'
            : 'mt-1 text-lg font-medium text-text-primary'
        }
      >
        {value}
      </p>
    </div>
  )
}
