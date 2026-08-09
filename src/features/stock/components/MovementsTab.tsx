import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Loader2, PackagePlus, Repeat } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/common/SelectField'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Pagination } from '@/components/common/Pagination'
import { AdjustStockModal } from '@/features/stock/components/AdjustStockModal'
import { TransferStockModal } from '@/features/stock/components/TransferStockModal'
import { useMovements } from '@/features/stock/hooks/useMovements'
import { useLocations } from '@/features/stock/hooks/useLocations'
import {
  MOVEMENT_TYPES,
  type ListMovementsQuery,
  type MovementType,
} from '@/features/stock/types/stock.types'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { localizedItemName } from '@/features/items/types/items.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatAmount, formatDate } from '@/lib/format'

const LIMIT = 20

const TYPE_VARIANT: Record<
  MovementType,
  'success' | 'danger' | 'info' | 'warning'
> = {
  RECEIPT: 'success',
  OPENING: 'success',
  ISSUE: 'danger',
  TRANSFER: 'info',
  ADJUSTMENT: 'warning',
}

export function MovementsTab() {
  const { t, i18n } = useTranslation('stock')
  const lang = i18n.language

  const canCreate = usePermission('stock.create')
  const canUpdate = usePermission('stock.update')

  const [itemId, setItemId] = useState('')
  const [type, setType] = useState<'all' | MovementType>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const allItems = useAllItems()
  const allLocations = useLocations()
  const lookupCurrency = useCurrencyLookup()

  const query: ListMovementsQuery = useMemo(
    () => ({
      itemId: itemId || undefined,
      type: type === 'all' ? undefined : type,
      from: from || undefined,
      to: to || undefined,
      page,
      limit: LIMIT,
    }),
    [itemId, type, from, to, page]
  )

  const movements = useMovements(query)
  const meta = movements.data?.meta
  const rows = movements.data?.data ?? []

  const itemName = (id: string) => {
    const item = allItems.data?.find((i) => i.id === id)
    return item ? `${item.code}` : id.slice(0, 8)
  }
  const locationCode = (id: string) =>
    allLocations.data?.find((l) => l.id === id)?.code ?? id.slice(0, 6)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <SelectField
            className="w-[200px]"
            id="mov-item"
            label={t('movements.item')}
            value={itemId}
            onChange={(e) => {
              setItemId(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: t('movements.allItems') },
              ...(allItems.data ?? []).map((i) => ({
                value: i.id,
                label: `${i.code} — ${localizedItemName(i, lang)}`,
              })),
            ]}
          />
          <SelectField
            className="w-[150px]"
            id="mov-type"
            label={t('movements.type')}
            value={type}
            onChange={(e) => {
              setType(e.target.value as 'all' | MovementType)
              setPage(1)
            }}
            options={[
              { value: 'all', label: t('movements.allTypes') },
              ...MOVEMENT_TYPES.map((ty) => ({
                value: ty,
                label: t(`type.${ty}`),
              })),
            ]}
          />
          <div className="w-[150px] space-y-2">
            <Label htmlFor="mov-from" className="field-label">
              {t('movements.from')}
            </Label>
            <div className="field-box">
              <Input
                id="mov-from"
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
          <div className="w-[150px] space-y-2">
            <Label htmlFor="mov-to" className="field-label">
              {t('movements.to')}
            </Label>
            <div className="field-box">
              <Input
                id="mov-to"
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canUpdate && (
            <Button variant="outline" onClick={() => setAdjustOpen(true)}>
              <PackagePlus className="size-4" />
              {t('adjust.action')}
            </Button>
          )}
          {canCreate && (
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <Repeat className="size-4" />
              {t('transfer.action')}
            </Button>
          )}
        </div>
      </div>

      {movements.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : movements.isError ? (
        <p className="py-8 text-center text-text-muted">
          {isPermissionDenied(movements.error)
            ? t('errors.permissionDeniedSection')
            : t('errors.generic')}
        </p>
      ) : !rows.length ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-text-muted">
          {t('movements.empty')}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                  <th className="px-4 py-2.5 font-medium">
                    {t('movements.no')}
                  </th>
                  <th className="px-4 py-2.5 font-medium">{t('ops.date')}</th>
                  <th className="px-4 py-2.5 font-medium">
                    {t('movements.type')}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t('movements.item')}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t('movements.route')}
                  </th>
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t('movements.qty')}
                  </th>
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t('movements.value')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-2.5 font-mono text-[13px]">
                      {m.movementNo}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">
                      {formatDate(m.movementDate, lang)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge variant={TYPE_VARIANT[m.type]}>
                        {t(`type.${m.type}`)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[13px] text-text-primary">
                      {itemName(m.itemId)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[12px] text-text-muted">
                        {locationCode(m.fromLocationId)}
                        <ArrowRight className="size-3 rtl:rotate-180" />
                        {locationCode(m.toLocationId)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono">
                      {formatAmount(m.qty, '', { locale: lang, decimals: 3 })}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono text-text-primary">
                      {formatMoney(
                        m.value,
                        lookupCurrency(m.costCurrency),
                        lang
                      )}
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

      <AdjustStockModal open={adjustOpen} onOpenChange={setAdjustOpen} />
      <TransferStockModal open={transferOpen} onOpenChange={setTransferOpen} />
    </div>
  )
}
