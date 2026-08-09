import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { useItemStock } from '@/features/stock/hooks/useItemStock'
import type { Item } from '@/features/items/types/items.types'
import { useVariants } from '@/features/items/hooks/useVariants'
import { useLookups } from '@/features/catalog/hooks/useLookups'
import { localizedLookupName } from '@/features/catalog/types/catalog.types'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatAmount } from '@/lib/format'

export function ItemStockSection({ item }: { item: Item }) {
  const { t, i18n } = useTranslation('stock')
  const lang = i18n.language

  const stock = useItemStock(item.id)
  const hasVariants = item.hasSize || item.hasColour
  const variants = useVariants(hasVariants ? item.id : undefined)
  const sizes = useLookups('size')
  const colours = useLookups('colour')
  const lookupCurrency = useCurrencyLookup()

  const data = stock.data
  const currency = data ? lookupCurrency(data.currency) : undefined

  const variantLabel = (variantId: string | null): string => {
    if (!variantId) return t('itemStock.base')
    const v = variants.data?.find((x) => x.id === variantId)
    if (!v) return variantId.slice(0, 8)
    const parts = [
      v.sizeId ? sizes.data?.find((s) => s.id === v.sizeId) : null,
      v.colourId ? colours.data?.find((c) => c.id === v.colourId) : null,
    ]
      .filter((x): x is NonNullable<typeof x> => !!x)
      .map((x) => localizedLookupName(x, lang))
    return parts.join(' / ') || v.sku || variantId.slice(0, 8)
  }

  // Flatten the variant → location tree into display rows.
  const rows = (data?.breakdown ?? []).flatMap((vs) =>
    vs.locations.map((loc) => ({
      key: `${vs.variantId ?? 'base'}-${loc.locationId}`,
      variant: variantLabel(vs.variantId),
      locationCode: loc.locationCode,
      qty: loc.qty,
      value: loc.value,
    }))
  )

  const qty = (n: number) => formatAmount(n, '', { locale: lang, decimals: 3 })

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('itemStock.title')}
        </h2>
        {data && (
          <div className="text-end">
            <span className="text-[13px] text-text-muted">
              {t('itemStock.onHand')}{' '}
            </span>
            <span className="font-mono text-[15px] text-text-primary">
              {qty(data.totalQty)}
            </span>
            <span className="mx-2 text-text-muted">·</span>
            <span className="font-mono text-[15px] text-text-primary">
              {formatMoney(data.totalValue, currency, lang)}
            </span>
          </div>
        )}
      </div>

      {stock.isLoading ? (
        <div className="flex py-6">
          <Loader2 className="size-5 animate-spin text-brand" />
        </div>
      ) : stock.isError ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-text-muted">
          {t('itemStock.unavailable')}
        </p>
      ) : !rows.length ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-text-muted">
          {t('itemStock.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                {hasVariants && (
                  <th className="px-4 py-2.5 font-medium">
                    {t('itemStock.variant')}
                  </th>
                )}
                <th className="px-4 py-2.5 font-medium">
                  {t('itemStock.location')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('itemStock.qty')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('itemStock.value')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.key}
                  className="border-b border-border last:border-b-0"
                >
                  {hasVariants && (
                    <td className="px-4 py-2.5 text-text-primary">
                      {r.variant}
                    </td>
                  )}
                  <td className="px-4 py-2.5 font-mono text-[13px] text-text-muted">
                    {r.locationCode}
                  </td>
                  <td className="px-4 py-2.5 text-end font-mono">
                    {qty(r.qty)}
                  </td>
                  <td className="px-4 py-2.5 text-end font-mono text-text-primary">
                    {formatMoney(r.value, currency, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
