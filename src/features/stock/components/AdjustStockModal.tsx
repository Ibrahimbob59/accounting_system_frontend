import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/common/Modal'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { useAdjustStock } from '@/features/stock/hooks/useMovements'
import { useLocations } from '@/features/stock/hooks/useLocations'
import { stockErrorMessage } from '@/features/stock/lib/stock-errors'
import { localizedLocationName } from '@/features/stock/types/stock.types'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { useVariants } from '@/features/items/hooks/useVariants'
import { localizedItemName } from '@/features/items/types/items.types'
import { toast } from '@/lib/swal'

const today = () => new Date().toISOString().slice(0, 10)

export function AdjustStockModal({
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
      title={t('adjust.title')}
      description={t('adjust.body')}
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
  const adjust = useAdjustStock()

  const [itemId, setItemId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [countedQty, setCountedQty] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(today())
  const [banner, setBanner] = useState<string | null>(null)

  const item = allItems.data?.find((i) => i.id === itemId)
  const hasVariants = !!item && (item.hasSize || item.hasColour)
  const variants = useVariants(hasVariants ? itemId : undefined)

  const submit = () => {
    setBanner(null)
    const qty = Number(countedQty)
    if (!itemId || !locationId || !Number.isFinite(qty)) {
      setBanner(t('adjust.incomplete'))
      return
    }
    if (hasVariants && !variantId) {
      setBanner(t('errors.variantRequired'))
      return
    }
    const cost = Number(unitCost)
    adjust.mutate(
      {
        itemId,
        variantId: variantId || undefined,
        locationId,
        countedQty: qty,
        unitCost: Number.isFinite(cost) && unitCost !== '' ? cost : undefined,
        movementDate: date || undefined,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast('success', t('adjust.done'))
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
        id="adjust-item"
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
          id="adjust-variant"
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
          id="adjust-location"
          label={t('ops.location')}
          placeholder={t('ops.selectLocation')}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          options={(locations.data ?? []).map((l) => ({
            value: l.id,
            label: `${l.code} — ${localizedLocationName(l, lang)}`,
          }))}
        />
        <TextField
          id="adjust-date"
          type="date"
          label={t('ops.date')}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="adjust-counted"
          type="number"
          step="0.001"
          label={t('adjust.countedQty')}
          value={countedQty}
          onChange={(e) => setCountedQty(e.target.value)}
        />
        <TextField
          id="adjust-unitcost"
          type="number"
          step="0.0001"
          label={t('adjust.unitCost')}
          placeholder={t('adjust.unitCostHint')}
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value)}
        />
      </div>

      <TextField
        id="adjust-reason"
        label={t('ops.reason')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          {t('ops.cancel')}
        </Button>
        <Button onClick={submit} disabled={adjust.isPending}>
          {adjust.isPending && <Loader2 className="animate-spin" />}
          {t('adjust.submit')}
        </Button>
      </div>
    </div>
  )
}
