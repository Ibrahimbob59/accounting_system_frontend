import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/common/DataTable'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
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
  // Rows carry their own currency code; the summary cards present a single
  // figure in the active company's currency (via ?presentIn), only falling back
  // to the per-currency breakdown when no conversion rate exists.
  const currency = useCurrencyLookup()
  const companyCurrency = useActiveCompanyBaseCurrency()
  const balance = usePartnerBalance(
    partnerId,
    asOf || undefined,
    companyCurrency
  )
  const transactions = usePartnerTransactions(partnerId, { page: 1, limit: 50 })

  const currencyColumns: ColumnDef<PartnerCurrencyBalance>[] = [
    { accessorKey: 'currency', header: t('detail.ledger.currency') },
    {
      accessorKey: 'debit',
      header: t('detail.ledger.columns.debit'),
      cell: ({ row }) =>
        formatMoney(
          row.original.debit,
          currency(row.original.currency),
          i18n.language
        ),
    },
    {
      accessorKey: 'credit',
      header: t('detail.ledger.columns.credit'),
      cell: ({ row }) =>
        formatMoney(
          row.original.credit,
          currency(row.original.currency),
          i18n.language
        ),
    },
    {
      accessorKey: 'net',
      header: t('detail.ledger.netBalance'),
      cell: ({ row }) =>
        formatMoney(
          row.original.net,
          currency(row.original.currency),
          i18n.language
        ),
    },
  ]

  const columns: ColumnDef<PartnerTransaction>[] = [
    {
      accessorKey: 'date',
      header: t('detail.ledger.columns.date'),
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString(),
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

  const b = balance.data
  // How each summary card renders:
  //  - 'native'    : figures already in the company currency → one number.
  //  - 'converted' : converted into the company currency (?presentIn) at a real
  //                  rate → the converted TOTAL as the headline, with the frozen
  //                  per-currency components beneath it and the rate in a caption.
  //  - 'breakdown' : couldn't convert (no rate) → the per-currency components ARE
  //                  the figure, never summed (the honest fallback).
  const mode: 'native' | 'converted' | 'breakdown' = !b
    ? 'breakdown'
    : b.baseCurrency && b.baseCurrency === companyCurrency
      ? 'native'
      : b.presentation && b.presentation.balanceBase !== null
        ? 'converted'
        : b.baseCurrency
          ? 'native'
          : 'breakdown'

  // Each card shows a `main` figure and, in the converted case, a `sub` line
  // listing the frozen per-currency components that make up that total.
  const showBase = (
    scalar: number | null | undefined,
    presFig: number | null | undefined,
    pick: (r: PartnerBaseCurrencyBalance) => number
  ): { main: string; sub: string | null } => {
    if (!b) return { main: '—', sub: null }
    const components =
      b.byBaseCurrency
        .map((r) => formatMoney(pick(r), currency(r.currency), i18n.language))
        .join(' · ') || '—'
    if (mode === 'converted' && b.presentation && presFig != null)
      return {
        main: formatMoney(
          presFig,
          currency(b.presentation.currency),
          i18n.language
        ),
        sub: components,
      }
    if (mode === 'native' && scalar != null)
      return {
        main: formatMoney(
          scalar,
          b.baseCurrency ? currency(b.baseCurrency) : undefined,
          i18n.language
        ),
        sub: null,
      }
    return { main: components, sub: null }
  }

  // A converted figure never stands alone — name the rate it used. When we
  // couldn't convert, say so rather than silently showing a foreign currency.
  const presentationNote: string | null = !b
    ? null
    : mode === 'converted' && b.presentation
      ? t(
          b.presentation.rates.length > 1
            ? 'detail.ledger.presentation.convertedMulti'
            : 'detail.ledger.presentation.converted',
          {
            currency: b.presentation.currency,
            rateType: b.presentation.rates[0]?.rateType ?? '',
            date: b.presentation.rates[0]?.rateDate ?? '',
          }
        )
      : companyCurrency && b.baseCurrency !== companyCurrency
        ? t('detail.ledger.presentation.mixedNoRate', {
            currency: companyCurrency,
          })
        : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-4 sm:grid-cols-3 sm:flex-1">
          <SummaryCard
            label={t('detail.ledger.totalDebit')}
            {...showBase(
              b?.totalDebitBase,
              b?.presentation?.totalDebitBase,
              (r) => r.totalDebitBase
            )}
          />
          <SummaryCard
            label={t('detail.ledger.totalCredit')}
            {...showBase(
              b?.totalCreditBase,
              b?.presentation?.totalCreditBase,
              (r) => r.totalCreditBase
            )}
          />
          <SummaryCard
            label={t('detail.ledger.netBalance')}
            emphasize
            {...showBase(
              b?.balanceBase,
              b?.presentation?.balanceBase,
              (r) => r.balanceBase
            )}
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

      {presentationNote && (
        <p className="text-xs text-text-muted">{presentationNote}</p>
      )}

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
  main,
  sub,
  emphasize,
}: {
  label: string
  main: string
  /** Frozen per-currency components behind a converted total; null otherwise. */
  sub?: string | null
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
        {main}
      </p>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </div>
  )
}
