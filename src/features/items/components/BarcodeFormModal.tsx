import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/common/Modal'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { FormBanner } from '@/components/common/FormBanner'
import {
  useCreateBarcode,
  useUpdateBarcode,
} from '@/features/items/hooks/useBarcodes'
import { itemErrorMessage } from '@/features/items/lib/item-errors'
import type { ItemBarcode } from '@/features/items/types/items.types'
import { toast } from '@/lib/swal'

export function BarcodeFormModal({
  itemId,
  variantOptions,
  barcode,
  open,
  onOpenChange,
}: {
  itemId: string
  variantOptions: { value: string; label: string }[]
  barcode?: ItemBarcode
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('items')
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={barcode ? t('barcodes.editTitle') : t('barcodes.addTitle')}
    >
      {open && (
        <Body
          key={barcode?.id ?? 'new'}
          itemId={itemId}
          variantOptions={variantOptions}
          barcode={barcode}
          onDone={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function Body({
  itemId,
  variantOptions,
  barcode,
  onDone,
}: {
  itemId: string
  variantOptions: { value: string; label: string }[]
  barcode?: ItemBarcode
  onDone: () => void
}) {
  const { t } = useTranslation('items')
  const isEdit = !!barcode

  const createBarcode = useCreateBarcode(itemId)
  const updateBarcode = useUpdateBarcode(itemId)

  const [code, setCode] = useState(barcode?.barcode ?? '')
  const [variantId, setVariantId] = useState(barcode?.variantId ?? '')
  const [isPrimary, setIsPrimary] = useState(barcode?.isPrimary ?? false)
  const [banner, setBanner] = useState<string | null>(null)

  const isPending = createBarcode.isPending || updateBarcode.isPending

  const submit = () => {
    setBanner(null)
    if (!code.trim()) {
      setBanner(t('barcodes.required'))
      return
    }
    const onError = (err: unknown) => setBanner(itemErrorMessage(err, t))
    const onSuccess = () => {
      toast('success', isEdit ? t('barcodes.saved') : t('barcodes.created'))
      onDone()
    }
    if (isEdit) {
      updateBarcode.mutate(
        { barcodeId: barcode.id, input: { barcode: code.trim(), isPrimary } },
        { onSuccess, onError }
      )
    } else {
      createBarcode.mutate(
        { barcode: code.trim(), variantId: variantId || undefined, isPrimary },
        { onSuccess, onError }
      )
    }
  }

  return (
    <div className="space-y-4">
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <TextField
        id="barcode-code"
        label={t('barcodes.code')}
        placeholder={t('barcodes.codePlaceholder')}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      {!isEdit && variantOptions.length > 0 && (
        <SelectField
          id="barcode-variant"
          label={t('barcodes.variant')}
          placeholder={t('barcodes.variantNone')}
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          options={variantOptions}
        />
      )}

      <CheckboxField
        id="barcode-primary"
        label={t('barcodes.isPrimary')}
        checked={isPrimary}
        onCheckedChange={(v) => setIsPrimary(v === true)}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          {t('barcodes.cancel')}
        </Button>
        <Button onClick={submit} disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {t('barcodes.save')}
        </Button>
      </div>
    </div>
  )
}
