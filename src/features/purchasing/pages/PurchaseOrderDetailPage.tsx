import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Ban,
  FileText,
  Loader2,
  PackageCheck,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PurchaseOrderStatusBadge } from '@/features/purchasing/components/PurchaseOrderStatusBadge'
import { ReceiveGoodsModal } from '@/features/purchasing/components/ReceiveGoodsModal'
import { usePurchaseOrder } from '@/features/purchasing/hooks/usePurchaseOrders'
import {
  useConfirmPurchaseOrder,
  useCancelPurchaseOrder,
  useDeletePurchaseOrder,
} from '@/features/purchasing/hooks/usePurchaseOrders'
import { useGoodsReceipts } from '@/features/purchasing/hooks/useGoodsReceipts'
import { purchasingErrorMessage } from '@/features/purchasing/lib/purchasing-errors'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { localizedItemName } from '@/features/items/types/items.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'
import { confirm, toast } from '@/lib/swal'

export function PurchaseOrderDetailPage() {
  const { t, i18n } = useTranslation('purchasing')
  const lang = i18n.language
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: po, isLoading, isError, error } = usePurchaseOrder(id)
  const receipts = useGoodsReceipts(id ? { purchaseOrderId: id } : undefined)
  const partners = useAllPartners()
  const allItems = useAllItems()
  const lookupCurrency = useCurrencyLookup()

  const confirmPO = useConfirmPurchaseOrder()
  const cancelPO = useCancelPurchaseOrder()
  const deletePO = useDeletePurchaseOrder()
  const [busy, setBusy] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)

  const canPost = usePermission('purchase.post')
  const canUpdate = usePermission('purchase.update')
  const canDelete = usePermission('purchase.delete')
  const canBill = usePermission('purchase.create')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }
  if (isError || !po) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const dash = t('po.detail.notSet')
  const currency = lookupCurrency(po.currencyCode)
  const money = (n: number) => formatMoney(n, currency, lang)
  const supplier =
    partners.data?.find((p) => p.id === po.supplierId)?.name ??
    po.supplierId.slice(0, 8)
  const itemName = (itemId: string) => {
    const item = allItems.data?.find((i) => i.id === itemId)
    return item
      ? `${item.code} — ${localizedItemName(item, lang)}`
      : itemId.slice(0, 8)
  }

  const isDraft = po.status === 'DRAFT'
  const canReceive =
    po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED'
  const canCreateBill =
    po.status === 'CONFIRMED' ||
    po.status === 'PARTIALLY_RECEIVED' ||
    po.status === 'RECEIVED'
  const canCancel = po.status !== 'CANCELLED' && po.status !== 'BILLED'
  const anyBusy =
    busy || confirmPO.isPending || cancelPO.isPending || deletePO.isPending

  const handleConfirm = async () => {
    const ok = await confirm({
      title: t('po.actions.confirmDialog.title'),
      description: t('po.actions.confirmDialog.body'),
      confirmLabel: t('po.actions.confirmDialog.confirm'),
      cancelLabel: t('po.actions.confirmDialog.cancel'),
    })
    if (!ok) return
    setBusy(true)
    confirmPO.mutate(po.id, {
      onSuccess: () => toast('success', t('po.actions.confirmed')),
      onError: (err) => toast('error', purchasingErrorMessage(err, t)),
      onSettled: () => setBusy(false),
    })
  }

  const handleCancel = async () => {
    const ok = await confirm({
      title: t('po.actions.cancelDialog.title'),
      description: t('po.actions.cancelDialog.body'),
      confirmLabel: t('po.actions.cancelDialog.confirm'),
      cancelLabel: t('po.actions.cancelDialog.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    setBusy(true)
    cancelPO.mutate(po.id, {
      onSuccess: () => toast('success', t('po.actions.cancelled')),
      onError: (err) => toast('error', purchasingErrorMessage(err, t)),
      onSettled: () => setBusy(false),
    })
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('po.actions.deleteDialog.title'),
      description: t('po.actions.deleteDialog.body'),
      confirmLabel: t('po.actions.deleteDialog.confirm'),
      cancelLabel: t('po.actions.deleteDialog.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deletePO.mutate(po.id, {
      onSuccess: () => {
        toast('success', t('po.actions.deleted'))
        navigate('/app/purchase-orders')
      },
      onError: (err) => toast('error', purchasingErrorMessage(err, t)),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/purchase-orders"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('po.detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            <span className="font-mono">{po.orderNo}</span>
          </h1>
          <PurchaseOrderStatusBadge status={po.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && canPost && (
            <Button onClick={() => void handleConfirm()} disabled={anyBusy}>
              <Send className="size-4" />
              {t('po.actions.confirm')}
            </Button>
          )}
          {isDraft && canUpdate && (
            <Button
              variant="outline"
              onClick={() => navigate(`/app/purchase-orders/${po.id}/edit`)}
              disabled={anyBusy}
            >
              <Pencil className="size-4" />
              {t('po.actions.edit')}
            </Button>
          )}
          {canReceive && canPost && (
            <Button onClick={() => setReceiveOpen(true)} disabled={anyBusy}>
              <PackageCheck className="size-4" />
              {t('po.actions.receive')}
            </Button>
          )}
          {canCreateBill && canBill && (
            <Button
              variant="outline"
              onClick={() => navigate(`/app/vendor-bills/new?poId=${po.id}`)}
              disabled={anyBusy}
            >
              <FileText className="size-4" />
              {t('po.actions.createBill')}
            </Button>
          )}
          {isDraft && canDelete && (
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={anyBusy}
            >
              <Trash2 className="size-4" />
              {t('po.actions.delete')}
            </Button>
          )}
          {!isDraft && canCancel && canUpdate && (
            <Button
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={anyBusy}
            >
              <Ban className="size-4" />
              {t('po.actions.cancel')}
            </Button>
          )}
        </div>
      </div>

      <Section title={t('po.detail.sections.details')}>
        <InfoRow label={t('po.detail.supplier')} value={supplier} />
        <InfoRow
          label={t('po.detail.orderDate')}
          value={formatDate(po.orderDate, lang)}
        />
        <InfoRow
          label={t('po.detail.expectedDate')}
          value={po.expectedDate ? formatDate(po.expectedDate, lang) : dash}
        />
        <InfoRow
          label={t('po.detail.currency')}
          value={
            po.currencyCode === currency?.code && po.rate === 1
              ? po.currencyCode
              : `${po.currencyCode} @ ${po.rate}`
          }
        />
        <InfoRow label={t('po.detail.notes')} value={po.notes ?? dash} />
      </Section>

      <LinesTable
        title={t('po.detail.sections.lines')}
        headers={[
          t('po.detail.lines.item'),
          t('po.detail.lines.ordered'),
          t('po.detail.lines.received'),
          t('po.detail.lines.cost'),
          t('po.detail.lines.net'),
          t('po.detail.lines.vat'),
          t('po.detail.lines.total'),
        ]}
      >
        {[...po.lines]
          .sort((a, b) => a.lineNo - b.lineNo)
          .map((l) => (
            <tr key={l.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-2.5">{itemName(l.itemId)}</td>
              <td className="px-4 py-2.5 text-end font-mono">{l.qtyOrdered}</td>
              <td className="px-4 py-2.5 text-end font-mono text-text-muted">
                {l.qtyReceived}
              </td>
              <td className="px-4 py-2.5 text-end font-mono">
                {money(l.unitCost)}
              </td>
              <td className="px-4 py-2.5 text-end font-mono">
                {money(l.netAmount)}
              </td>
              <td className="px-4 py-2.5 text-end font-mono text-text-muted">
                {money(l.vatAmount)}
              </td>
              <td className="px-4 py-2.5 text-end font-mono text-text-primary">
                {money(l.totalAmount)}
              </td>
            </tr>
          ))}
      </LinesTable>

      <section className="ms-auto max-w-sm space-y-2">
        <TotalRow
          label={t('detail.totals.subtotal')}
          value={money(po.subtotal)}
        />
        <TotalRow label={t('detail.totals.vat')} value={money(po.vatTotal)} />
        <TotalRow
          label={t('detail.totals.grand')}
          value={money(po.grandTotal)}
          strong
        />
      </section>

      {(receipts.data?.data.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-base font-bold text-text-primary">
            {t('po.detail.sections.receipts')}
          </h2>
          <ul className="space-y-1 text-[14px]">
            {receipts.data?.data.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/app/goods-receipts/${r.id}`}
                  className="font-mono text-brand hover:underline"
                >
                  {r.receiptNo}
                </Link>
                <span className="ms-2 text-text-muted">
                  {formatDate(r.receiptDate, lang)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {receiveOpen && (
        <ReceiveGoodsModal
          po={po}
          open={receiveOpen}
          onOpenChange={setReceiveOpen}
          onReceived={() => void receipts.refetch()}
        />
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-bold text-text-primary">
        {title}
      </h2>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
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

function LinesTable({
  title,
  headers,
  children,
}: {
  title: string
  headers: string[]
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-bold text-text-primary">
        {title}
      </h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 font-medium ${i === 0 ? '' : 'text-end'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  )
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        strong
          ? 'border-t border-border pt-2 text-[16px] font-bold text-text-primary'
          : 'text-[14px] text-text-secondary'
      }`}
    >
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
