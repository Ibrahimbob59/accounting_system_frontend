import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney } from '@/lib/format'
import type { TrialBalanceRow } from '@/features/reports/types/reports.types'

/**
 * One balanced trial balance in a single currency — the shared renderer for
 * both the uniform/converted flat view and each per-currency group of a
 * mixed-base scope. A zero amount is dashed rather than "0.00" so the eye lands
 * on the side that actually carries each account's balance.
 */
export function TrialBalanceTable({
  rows,
  currency,
  totalDebit,
  totalCredit,
  isBalanced,
  rolledUp,
}: {
  rows: TrialBalanceRow[]
  currency: string
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  rolledUp: boolean
}) {
  const { t, i18n } = useTranslation('reports')
  const lookupCurrency = useCurrencyLookup()
  const record = lookupCurrency(currency)

  const money = (n: number) =>
    n === 0 ? '—' : formatMoney(n, record, i18n.language)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-text-primary">
          {t('table.heading', { currency })}
        </h3>
        <StatusBadge variant={isBalanced ? 'success' : 'danger'}>
          {isBalanced ? t('table.balanced') : t('table.unbalanced')}
        </StatusBadge>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
              <th className="px-4 py-2.5 font-medium">
                {rolledUp ? t('table.group') : t('table.account')}
              </th>
              <th className="px-4 py-2.5 text-end font-medium">
                {t('table.debit')}
              </th>
              <th className="px-4 py-2.5 text-end font-medium">
                {t('table.credit')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-text-muted"
                >
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.accountId || row.accountNumber}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[13px] text-text-muted">
                      {row.accountNumber}
                    </span>
                    {row.accountName && (
                      <span className="ms-2 text-text-primary">
                        {row.accountName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-end font-mono">
                    {money(row.debit)}
                  </td>
                  <td className="px-4 py-2.5 text-end font-mono">
                    {money(row.credit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-semibold text-text-primary">
              <td className="px-4 py-2.5">{t('table.total')}</td>
              <td className="px-4 py-2.5 text-end font-mono">
                {formatMoney(totalDebit, record, i18n.language)}
              </td>
              <td className="px-4 py-2.5 text-end font-mono">
                {formatMoney(totalCredit, record, i18n.language)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
