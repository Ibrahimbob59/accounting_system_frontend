import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink, Loader2, Send, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StockCountStatusBadge } from '@/features/stock/components/StockCountStatusBadge'
import {
  useStockCount,
  usePostStockCount,
  useDeleteStockCount,
} from '@/features/stock/hooks/useStockCounts'
import { stockOpsErrorMessage } from '@/features/stock/lib/stock-ops-errors'
import { useLocations } from '@/features/stock/hooks/useLocations'
import { localizedLocationName } from '@/features/stock/types/stock.types'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { localizedItemName } from '@/features/items/types/items.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'
import { confirm, toast } from '@/lib/swal'

export function StockCountDetailPage() {
  const { t, i18n } = useTranslation('stockOps')
  const lang = i18n.language
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: count, isLoading, isError, error } = useStockCount(id)
  const locations = useLocations({ type: 'INTERNAL' })
  const allItems = useAllItems()
  const companyBase = useActiveCompanyBaseCurrency()
  const lookupCurrency = useCurrencyLookup()

  const postCount = usePostStockCount()
  const deleteCount = useDeleteStockCount()
  const [posting, setPosting] = useState(false)
  const canPost = usePermission('stock.post')
  const canDelete = usePermission('stock.delete')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }
  if (isError || !count) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const dash = t('count.detail.notSet')
  const baseCurrency = companyBase ? lookupCurrency(companyBase) : undefined
  const money = (n: number) => formatMoney(n, baseCurrency, lang)
  const location = locations.data?.find((l) => l.id === count.locationId)
  const locationLabel = location
    ? `${location.code} — ${localizedLocationName(location, lang)}`
    : count.locationId.slice(0, 8)
  const itemName = (itemId: string) => {
    const item = allItems.data?.find((i) => i.id === itemId)
    return item
      ? `${item.code} — ${localizedItemName(item, lang)}`
      : itemId.slice(0, 8)
  }

  const isDraft = count.status === 'DRAFT'
  const busy = posting || deleteCount.isPending

  const handlePost = async () => {
    const ok = await confirm({
      title: t('count.actions.postDialog.title'),
      description: t('count.actions.postDialog.body'),
      confirmLabel: t('count.actions.postDialog.confirm'),
      cancelLabel: t('count.actions.postDialog.cancel'),
    })
    if (!ok) return
    setPosting(true)
    postCount.mutate(count.id, {
      onSuccess: () => toast('success', t('count.actions.posted')),
      onError: (err) => toast('error', stockOpsErrorMessage(err, t)),
      onSettled: () => setPosting(false),
    })
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('count.actions.deleteDialog.title'),
      description: t('count.actions.deleteDialog.body'),
      confirmLabel: t('count.actions.deleteDialog.confirm'),
      cancelLabel: t('count.actions.deleteDialog.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteCount.mutate(count.id, {
      onSuccess: () => {
        toast('success', t('count.actions.deleted'))
        navigate('/app/stock-counts')
      },
      onError: (err) => toast('error', stockOpsErrorMessage(err, t)),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/stock-counts"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('count.detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            <span className="font-mono">{count.countNo}</span>
          </h1>
          <StockCountStatusBadge status={count.status} />
        </div>

        {isDraft && (
          <div className="flex flex-wrap gap-2">
            {canPost && (
              <Button onClick={() => void handlePost()} disabled={busy}>
                <Send className="size-4" />
                {t('count.actions.post')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={busy}
              >
                <Trash2 className="size-4" />
                {t('count.actions.delete')}
              </Button>
            )}
          </div>
        )}
      </div>

      <section className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <InfoRow label={t('count.detail.location')} value={locationLabel} />
        <InfoRow
          label={t('count.detail.date')}
          value={formatDate(count.countDate, lang)}
        />
        <InfoRow label={t('count.detail.notes')} value={count.notes ?? dash} />
        {count.status === 'POSTED' && (
          <InfoRow
            label={t('count.detail.varianceValue')}
            value={money(count.varianceValueBase)}
          />
        )}
        {count.journalEntryId && (
          <InfoRow
            label={t('count.detail.journalEntry')}
            value={
              <Link
                to={`/app/journal-entries/${count.journalEntryId}`}
                className="inline-flex items-center gap-1 text-brand hover:underline"
              >
                {t('count.detail.viewEntry')}
                <ExternalLink className="size-3.5" />
              </Link>
            }
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('count.detail.lines')}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('count.detail.col.item')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('count.detail.col.system')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('count.detail.col.counted')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('count.detail.col.variance')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('count.detail.col.value')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...(count.lines ?? [])]
                .sort((a, b) => a.lineNo - b.lineNo)
                .map((l) => {
                  const variance =
                    count.status === 'POSTED' ? l.varianceQty : null
                  return (
                    <tr
                      key={l.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-2.5">{itemName(l.itemId)}</td>
                      <td className="px-4 py-2.5 text-end font-mono text-text-muted">
                        {l.systemQty}
                      </td>
                      <td className="px-4 py-2.5 text-end font-mono">
                        {l.countedQty}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-end font-mono ${
                          variance == null
                            ? 'text-text-muted'
                            : variance > 0
                              ? 'text-brand'
                              : variance < 0
                                ? 'text-danger'
                                : 'text-text-muted'
                        }`}
                      >
                        {variance == null
                          ? '—'
                          : variance > 0
                            ? `+${variance}`
                            : variance}
                      </td>
                      <td className="px-4 py-2.5 text-end font-mono text-text-muted">
                        {count.status === 'POSTED'
                          ? money(l.varianceValueBase)
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
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
