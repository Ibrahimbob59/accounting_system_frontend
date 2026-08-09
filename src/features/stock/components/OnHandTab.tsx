import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { Pagination } from '@/components/common/Pagination'
import { useBulkOnHand } from '@/features/stock/hooks/useBulkOnHand'
import { useLocations } from '@/features/stock/hooks/useLocations'
import {
  localizedLocationName,
  type BulkOnHandQuery,
  type OnHandBreakdown,
} from '@/features/stock/types/stock.types'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { localizedItemName } from '@/features/items/types/items.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatAmount } from '@/lib/format'

const LIMIT = 50

export function OnHandTab() {
  const { t, i18n } = useTranslation('stock')
  const lang = i18n.language
  const navigate = useNavigate()

  const [locationId, setLocationId] = useState('')
  const [breakdown, setBreakdown] = useState<OnHandBreakdown>('total')
  const [includeZero, setIncludeZero] = useState(false)
  const [page, setPage] = useState(1)

  const locations = useLocations({ type: 'INTERNAL' })
  const allItems = useAllItems()
  const lookupCurrency = useCurrencyLookup()

  const query: BulkOnHandQuery = useMemo(
    () => ({
      locationId: locationId || undefined,
      breakdown,
      includeZero: includeZero || undefined,
      page,
      limit: LIMIT,
    }),
    [locationId, breakdown, includeZero, page]
  )

  const onHand = useBulkOnHand(query)
  const meta = onHand.data?.meta
  const rows = onHand.data?.data ?? []

  const itemName = (id: string) => {
    const item = allItems.data?.find((i) => i.id === id)
    return item ? localizedItemName(item, lang) : id.slice(0, 8)
  }
  const itemCode = (id: string) =>
    allItems.data?.find((i) => i.id === id)?.code ?? ''

  const byLocation = breakdown === 'byLocation'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          className="w-[200px]"
          id="onhand-location"
          label={t('onHand.location')}
          value={locationId}
          onChange={(e) => {
            setLocationId(e.target.value)
            setPage(1)
          }}
          options={[
            { value: '', label: t('onHand.allLocations') },
            ...(locations.data ?? []).map((l) => ({
              value: l.id,
              label: `${l.code} — ${localizedLocationName(l, lang)}`,
            })),
          ]}
        />
        <SelectField
          className="w-[160px]"
          id="onhand-breakdown"
          label={t('onHand.breakdown')}
          value={breakdown}
          onChange={(e) => {
            setBreakdown(e.target.value as OnHandBreakdown)
            setPage(1)
          }}
          options={[
            { value: 'total', label: t('onHand.total') },
            { value: 'byLocation', label: t('onHand.byLocation') },
          ]}
        />
        <div className="pb-2">
          <CheckboxField
            id="onhand-include-zero"
            label={t('onHand.includeZero')}
            checked={includeZero}
            onCheckedChange={(v) => {
              setIncludeZero(v === true)
              setPage(1)
            }}
          />
        </div>
      </div>

      {onHand.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : onHand.isError ? (
        <p className="py-8 text-center text-text-muted">
          {isPermissionDenied(onHand.error)
            ? t('errors.permissionDeniedSection')
            : t('errors.generic')}
        </p>
      ) : !rows.length ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-text-muted">
          {t('onHand.empty')}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                  <th className="px-4 py-2.5 font-medium">
                    {t('onHand.item')}
                  </th>
                  {byLocation && (
                    <th className="px-4 py-2.5 font-medium">
                      {t('onHand.locationCol')}
                    </th>
                  )}
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t('onHand.qty')}
                  </th>
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t('onHand.avgCost')}
                  </th>
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t('onHand.value')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={`${r.itemId}-${r.variantId ?? ''}-${r.locationId ?? idx}`}
                    className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-secondary/50"
                    onClick={() => navigate(`/app/items/${r.itemId}`)}
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-text-primary">
                        {itemName(r.itemId)}
                      </span>
                      {itemCode(r.itemId) && (
                        <span className="ms-2 font-mono text-[12px] text-text-muted">
                          {itemCode(r.itemId)}
                        </span>
                      )}
                      {r.variantId && (
                        <span className="ms-2 text-[12px] text-text-muted">
                          {t('onHand.variant')}
                        </span>
                      )}
                    </td>
                    {byLocation && (
                      <td className="px-4 py-2.5 font-mono text-[13px] text-text-muted">
                        {r.locationCode ?? '—'}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-end font-mono">
                      {formatAmount(r.qty, '', { locale: lang, decimals: 3 })}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono text-text-muted">
                      {formatMoney(r.avgCost, lookupCurrency(r.currency), lang)}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono text-text-primary">
                      {formatMoney(r.value, lookupCurrency(r.currency), lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </div>
      )}
    </div>
  )
}
