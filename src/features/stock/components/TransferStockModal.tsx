import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/common/Modal'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { useTransferStock } from '@/features/stock/hooks/useMovements'
import { useLocations } from '@/features/stock/hooks/useLocations'
import { stockErrorMessage } from '@/features/stock/lib/stock-errors'
import { localizedLocationName } from '@/features/stock/types/stock.types'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { useVariants } from '@/features/items/hooks/useVariants'
import { localizedItemName } from '@/features/items/types/items.types'
import { toast } from '@/lib/swal'

const today = () => new Date().toISOString().slice(0, 10)

export function TransferStockModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('stock')
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('transfer.title')}
      description={t('transfer.body')}
    >
      {open && <Body onDone={() => onOpenChange(false)} />}
    </Modal>
  )
}

function Body({ onDone }: { onDone: () => void }) {
  const { t, i18n } = useTranslation('stock')
  const lang = i18n.language

  const allItems = useAllItems()
  const locations = useLocations({ type: 'INTERNAL' })
  const transfer = useTransferStock()

  const [itemId, setItemId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [fromLocationId, setFromLocationId] = useState('')
  const [toLocationId, setToLocationId] = useState('')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(today())
  const [banner, setBanner] = useState<string | null>(null)

  const item = allItems.data?.find((i) => i.id === itemId)
  const hasVariants = !!item && (item.hasSize || item.hasColour)
  const variants = useVariants(hasVariants ? itemId : undefined)

  const locationOptions = (locations.data ?? []).map((l) => ({
    value: l.id,
    label: `${l.code} — ${localizedLocationName(l, lang)}`,
  }))

  const submit = () => {
    setBanner(null)
    const amount = Number(qty)
    if (
      !itemId ||
      !fromLocationId ||
      !toLocationId ||
      !Number.isFinite(amount)
    ) {
      setBanner(t('transfer.incomplete'))
      return
    }
    if (fromLocationId === toLocationId) {
      setBanner(t('errors.sameLocation'))
      return
    }
    if (hasVariants && !variantId) {
      setBanner(t('errors.variantRequired'))
      return
    }
    transfer.mutate(
      {
        itemId,
        variantId: variantId || undefined,
        fromLocationId,
        toLocationId,
        qty: amount,
        movementDate: date || undefined,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast('success', t('transfer.done'))
          onDone()
        },
        onError: (err) => setBanner(stockErrorMessage(err, t)),
      }
    )
  }

  return (
    <div className="space-y-4">
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <SelectField
        id="transfer-item"
        label={t('ops.item')}
        placeholder={t('ops.selectItem')}
        value={itemId}
        onChange={(e) => {
          setItemId(e.target.value)
          setVariantId('')
        }}
        options={(allItems.data ?? []).map((i) => ({
          value: i.id,
          label: `${i.code} — ${localizedItemName(i, lang)}`,
        }))}
      />

      {hasVariants && (
        <SelectField
          id="transfer-variant"
          label={t('ops.variant')}
          placeholder={t('ops.selectVariant')}
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          options={(variants.data ?? []).map((v) => ({
            value: v.id,
            label: v.sku || v.id.slice(0, 8),
          }))}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="transfer-from"
          label={t('transfer.from')}
          placeholder={t('ops.selectLocation')}
          value={fromLocationId}
          onChange={(e) => setFromLocationId(e.target.value)}
          options={locationOptions}
        />
        <SelectField
          id="transfer-to"
          label={t('transfer.to')}
          placeholder={t('ops.selectLocation')}
          value={toLocationId}
          onChange={(e) => setToLocationId(e.target.value)}
          options={locationOptions}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="transfer-qty"
          type="number"
          step="0.001"
          label={t('transfer.qty')}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <TextField
          id="transfer-date"
          type="date"
          label={t('ops.date')}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <TextField
        id="transfer-reason"
        label={t('ops.reason')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          {t('ops.cancel')}
        </Button>
        <Button onClick={submit} disabled={transfer.isPending}>
          {transfer.isPending && <Loader2 className="animate-spin" />}
          {t('transfer.submit')}
        </Button>
      </div>
    </div>
  )
}
