import type { StatementLine } from '@/features/reports/types/reports.types'

/** A titled block of statement lines with a total row — reused for the income
 *  statement (revenue / expenses) and balance sheet (assets / liabilities /
 *  equity). Amounts are pre-formatted by the caller via `money`. */
export function StatementSection({
  title,
  lines,
  total,
  totalLabel,
  money,
  emptyLabel,
}: {
  title: string
  lines: StatementLine[]
  total: number
  totalLabel: string
  money: (n: number) => string
  emptyLabel: string
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-[15px] font-bold text-text-primary">
        {title}
      </h3>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-[14px]">
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-text-muted" colSpan={2}>
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              lines.map((l) => (
                <tr
                  key={l.accountId || l.accountNumber}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-2">
                    <span className="font-mono text-[13px] text-text-muted">
                      {l.accountNumber}
                    </span>
                    <span className="ms-2 text-text-primary">
                      {l.accountName}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-end font-mono">
                    {money(l.amount)}
                  </td>
                </tr>
              ))
            )}
            <tr className="border-t border-border bg-surface-secondary font-semibold">
              <td className="px-4 py-2.5 text-text-primary">{totalLabel}</td>
              <td className="px-4 py-2.5 text-end font-mono text-text-primary">
                {money(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
