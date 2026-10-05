import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2, Loader2, Send, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StockTransferStatusBadge } from '@/features/stock/components/StockTransferStatusBadge'
import {
  useStockTransfer,
  useApproveStockTransfer,
  usePostStockTransfer,
  useDeleteStockTransfer,
} from '@/features/stock/hooks/useStockTransfers'
import { stockOpsErrorMessage } from '@/features/stock/lib/stock-ops-errors'
import { useLocations } from '@/features/stock/hooks/useLocations'
import { localizedLocationName } from '@/features/stock/types/stock.types'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { localizedItemName } from '@/features/items/types/items.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { formatDate } from '@/lib/format'
import { confirm, toast } from '@/lib/swal'

export function StockTransferDetailPage() {
  const { t, i18n } = useTranslation('stockOps')
  const lang = i18n.language
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: transfer, isLoading, isError, error } = useStockTransfer(id)
  const locations = useLocations({ type: 'INTERNAL' })
  const allItems = useAllItems()

  const approveTransfer = useApproveStockTransfer()
  const postTransfer = usePostStockTransfer()
  const deleteTransfer = useDeleteStockTransfer()
  const [busy, setBusy] = useState(false)
  const canApprove = usePermission('stock.approve')
  const canPost = usePermission('stock.post')
  const canDelete = usePermission('stock.delete')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }
  if (isError || !transfer) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const dash = t('transfer.detail.notSet')
  const locName = (locId: string) => {
    const l = locations.data?.find((x) => x.id === locId)
    return l
      ? `${l.code} — ${localizedLocationName(l, lang)}`
      : locId.slice(0, 8)
  }
  const itemName = (itemId: string) => {
    const item = allItems.data?.find((i) => i.id === itemId)
    return item
      ? `${item.code} — ${localizedItemName(item, lang)}`
      : itemId.slice(0, 8)
  }

  const isDraft = transfer.status === 'DRAFT'
  const canBePosted = isDraft || transfer.status === 'APPROVED'
  const canBeDeleted =
    transfer.status !== 'POSTED' && transfer.status !== 'CANCELLED'
  const anyBusy =
    busy ||
    approveTransfer.isPending ||
    postTransfer.isPending ||
    deleteTransfer.isPending

  const handleApprove = async () => {
    const ok = await confirm({
      title: t('transfer.actions.approveDialog.title'),
      description: t('transfer.actions.approveDialog.body'),
      confirmLabel: t('transfer.actions.approveDialog.confirm'),
      cancelLabel: t('transfer.actions.cancelDialog'),
    })
    if (!ok) return
    setBusy(true)
    approveTransfer.mutate(transfer.id, {
      onSuccess: () => toast('success', t('transfer.actions.approved')),
      onError: (err) => toast('error', stockOpsErrorMessage(err, t)),
      onSettled: () => setBusy(false),
    })
  }

  const handlePost = async () => {
    const ok = await confirm({
      title: t('transfer.actions.postDialog.title'),
      description: t('transfer.actions.postDialog.body'),
      confirmLabel: t('transfer.actions.postDialog.confirm'),
      cancelLabel: t('transfer.actions.cancelDialog'),
    })
    if (!ok) return
    setBusy(true)
    postTransfer.mutate(transfer.id, {
      onSuccess: () => toast('success', t('transfer.actions.posted')),
      onError: (err) => toast('error', stockOpsErrorMessage(err, t)),
      onSettled: () => setBusy(false),
    })
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('transfer.actions.deleteDialog.title'),
      description: t('transfer.actions.deleteDialog.body'),
      confirmLabel: t('transfer.actions.deleteDialog.confirm'),
      cancelLabel: t('transfer.actions.cancelDialog'),
      variant: 'danger',
    })
    if (!ok) return
    deleteTransfer.mutate(transfer.id, {
      onSuccess: () => {
        toast('success', t('transfer.actions.deleted'))
        navigate('/app/stock-transfers')
      },
      onError: (err) => toast('error', stockOpsErrorMessage(err, t)),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/stock-transfers"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('transfer.detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            <span className="font-mono">{transfer.transferNo}</span>
          </h1>
          <StockTransferStatusBadge status={transfer.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && canApprove && (
            <Button
              variant="outline"
              onClick={() => void handleApprove()}
              disabled={anyBusy}
            >
              <CheckCircle2 className="size-4" />
              {t('transfer.actions.approve')}
            </Button>
          )}
          {canBePosted && canPost && (
            <Button onClick={() => void handlePost()} disabled={anyBusy}>
              <Send className="size-4" />
              {t('transfer.actions.post')}
            </Button>
          )}
          {canBeDeleted && canDelete && (
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={anyBusy}
            >
              <Trash2 className="size-4" />
              {t('transfer.actions.delete')}
            </Button>
          )}
        </div>
      </div>

      <section className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <InfoRow
          label={t('transfer.detail.from')}
          value={locName(transfer.fromLocationId)}
        />
        <InfoRow
          label={t('transfer.detail.to')}
          value={locName(transfer.toLocationId)}
        />
        <InfoRow
          label={t('transfer.detail.date')}
          value={formatDate(transfer.transferDate, lang)}
        />
        <InfoRow
          label={t('transfer.detail.notes')}
          value={transfer.notes ?? dash}
        />
        {transfer.approvedAt && (
          <InfoRow
            label={t('transfer.detail.approvedAt')}
            value={formatDate(transfer.approvedAt, lang)}
          />
        )}
        {transfer.postedAt && (
          <InfoRow
            label={t('transfer.detail.postedAt')}
            value={formatDate(transfer.postedAt, lang)}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('transfer.detail.lines')}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('transfer.detail.col.item')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('transfer.detail.col.qty')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...(transfer.lines ?? [])]
                .sort((a, b) => a.lineNo - b.lineNo)
                .map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-2.5">{itemName(l.itemId)}</td>
                    <td className="px-4 py-2.5 text-end font-mono">{l.qty}</td>
                  </tr>
                ))}
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
