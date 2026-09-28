import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { useCreateGoodsReceipt } from '@/features/purchasing/hooks/useGoodsReceipts'
import { purchasingErrorMessage } from '@/features/purchasing/lib/purchasing-errors'
import type { PurchaseOrder } from '@/features/purchasing/types/purchasing.types'
import { useLocations } from '@/features/stock/hooks/useLocations'
import { localizedLocationName } from '@/features/stock/types/stock.types'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { localizedItemName } from '@/features/items/types/items.types'
import { toast } from '@/lib/swal'

const today = () => new Date().toISOString().slice(0, 10)

interface ReceiveGoodsModalProps {
  po: PurchaseOrder
  open: boolean
  onOpenChange: (open: boolean) => void
  onReceived: () => void
}

export function ReceiveGoodsModal({
  po,
  open,
  onOpenChange,
  onReceived,
}: ReceiveGoodsModalProps) {
  const { t, i18n } = useTranslation('purchasing')
  const lang = i18n.language
  const locations = useLocations({ type: 'INTERNAL' })
  const items = useAllItems()
  const createReceipt = useCreateGoodsReceipt()

  const outstanding = useMemo(
    () =>
      po.lines
        .map((l) => ({
          line: l,
          remaining: Math.round((l.qtyOrdered - l.qtyReceived) * 1000) / 1000,
        }))
        .filter((r) => r.remaining > 0),
    [po.lines]
  )

  const [locationId, setLocationId] = useState('')
  const [receiptDate, setReceiptDate] = useState(today())
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(outstanding.map((r) => [r.line.id, r.remaining]))
  )
  const [banner, setBanner] = useState<string | null>(null)

  const itemName = (itemId: string) => {
    const item = items.data?.find((i) => i.id === itemId)
    return item
      ? `${item.code} — ${localizedItemName(item, lang)}`
      : itemId.slice(0, 8)
  }

  const setLine = (lineId: string, value: string, max: number) => {
    const v = Number(value)
    const clamped =
      !Number.isFinite(v) || v < 0
        ? 0
        : Math.min(Math.round(v * 1000) / 1000, max)
    setQty((prev) => ({ ...prev, [lineId]: clamped }))
  }

  const lines = outstanding
    .map((r) => ({
      purchaseOrderLineId: r.line.id,
      qtyReceived: qty[r.line.id] ?? 0,
    }))
    .filter((l) => l.qtyReceived > 0)

  const handleReceive = () => {
    setBanner(null)
    if (!locationId) {
      setBanner(t('receive.validation.locationRequired'))
      return
    }
    if (lines.length === 0) {
      setBanner(t('receive.validation.noLines'))
      return
    }
    createReceipt.mutate(
      { purchaseOrderId: po.id, locationId, receiptDate, lines },
      {
        onSuccess: () => {
          toast('success', t('receive.received'))
          onReceived()
          onOpenChange(false)
        },
        onError: (err) => setBanner(purchasingErrorMessage(err, t)),
      }
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('receive.title', { number: po.orderNo })}
      description={t('receive.subtitle')}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('receive.cancel')}
          </Button>
          <Button onClick={handleReceive} disabled={createReceipt.isPending}>
            {createReceipt.isPending && <Loader2 className="animate-spin" />}
            {t('receive.confirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {banner && <FormBanner variant="error">{banner}</FormBanner>}

        <SelectField
          id="gr-location"
          label={t('receive.location')}
          placeholder={t('receive.selectLocation')}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          options={(locations.data ?? []).map((l) => ({
            value: l.id,
            label: `${l.code} — ${localizedLocationName(l, lang)}`,
          }))}
        />
        <div>
          <label
            htmlFor="gr-date"
            className="mb-1 block text-[13px] text-text-muted"
          >
            {t('receive.date')}
          </label>
          <Input
            id="gr-date"
            type="date"
            value={receiptDate}
            onChange={(e) => setReceiptDate(e.target.value)}
          />
        </div>

        {outstanding.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[14px] text-text-muted">
            {t('receive.nothingOutstanding')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                  <th className="px-3 py-2 font-medium">{t('receive.item')}</th>
                  <th className="px-3 py-2 text-end font-medium">
                    {t('receive.outstanding')}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {t('receive.qty')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {outstanding.map((r) => (
                  <tr
                    key={r.line.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-3 py-2">{itemName(r.line.itemId)}</td>
                    <td className="px-3 py-2 text-end font-mono">
                      {r.remaining}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="0.001"
                        min={0}
                        max={r.remaining}
                        className="w-28 text-end font-mono"
                        value={qty[r.line.id] ?? ''}
                        onChange={(e) =>
                          setLine(r.line.id, e.target.value, r.remaining)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}
