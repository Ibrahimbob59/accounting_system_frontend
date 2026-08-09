import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useValuation } from '@/features/stock/hooks/useMovements'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { localizedItemName } from '@/features/items/types/items.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatAmount } from '@/lib/format'

export function ValuationTab() {
  const { t, i18n } = useTranslation('stock')
  const lang = i18n.language
  const navigate = useNavigate()

  const [asOf, setAsOf] = useState('')
  const valuation = useValuation(asOf || undefined)
  const allItems = useAllItems()
  const lookupCurrency = useCurrencyLookup()

  const data = valuation.data
  const currency = data ? lookupCurrency(data.currency) : undefined

  const itemLabel = (id: string) => {
    const item = allItems.data?.find((i) => i.id === id)
    return item
      ? `${item.code} — ${localizedItemName(item, lang)}`
      : id.slice(0, 8)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-[180px] space-y-2">
          <Label htmlFor="val-asof" className="field-label">
            {t('valuation.asOf')}
          </Label>
          <div className="field-box">
            <Input
              id="val-asof"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
        </div>
        {data && (
          <div className="text-end">
            <p className="text-[13px] text-text-muted">
              {t('valuation.totalValue')}
            </p>
            <p className="font-display text-2xl font-bold text-text-primary">
              {formatMoney(data.totalValue, currency, lang)}
            </p>
          </div>
        )}
      </div>

      {valuation.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : valuation.isError ? (
        <p className="py-8 text-center text-text-muted">
          {isPermissionDenied(valuation.error)
            ? t('errors.permissionDeniedSection')
            : t('errors.generic')}
        </p>
      ) : !data?.items.length ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-text-muted">
          {t('valuation.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('valuation.item')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('valuation.qty')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('valuation.value')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr
                  key={row.itemId}
                  className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-secondary/50"
                  onClick={() => navigate(`/app/items/${row.itemId}`)}
                >
                  <td className="px-4 py-2.5 text-text-primary">
                    {itemLabel(row.itemId)}
                  </td>
                  <td className="px-4 py-2.5 text-end font-mono">
                    {formatAmount(row.qty, '', { locale: lang, decimals: 3 })}
                  </td>
                  <td className="px-4 py-2.5 text-end font-mono text-text-primary">
                    {formatMoney(row.value, currency, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
