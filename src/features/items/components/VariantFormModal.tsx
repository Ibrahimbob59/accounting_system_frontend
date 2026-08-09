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
  useCreateVariant,
  useUpdateVariant,
} from '@/features/items/hooks/useVariants'
import { itemErrorMessage } from '@/features/items/lib/item-errors'
import type { Item, ItemVariant } from '@/features/items/types/items.types'
import { useLookups } from '@/features/catalog/hooks/useLookups'
import { localizedLookupName } from '@/features/catalog/types/catalog.types'
import { toast } from '@/lib/swal'

export function VariantFormModal({
  item,
  variant,
  open,
  onOpenChange,
}: {
  item: Item
  variant?: ItemVariant
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('items')
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={variant ? t('variants.editTitle') : t('variants.addTitle')}
    >
      {open && (
        <Body
          key={variant?.id ?? 'new'}
          item={item}
          variant={variant}
          onDone={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function Body({
  item,
  variant,
  onDone,
}: {
  item: Item
  variant?: ItemVariant
  onDone: () => void
}) {
  const { t, i18n } = useTranslation('items')
  const lang = i18n.language
  const isEdit = !!variant

  const sizes = useLookups('size')
  const colours = useLookups('colour')
  const createVariant = useCreateVariant(item.id)
  const updateVariant = useUpdateVariant(item.id)

  const [sizeId, setSizeId] = useState(variant?.sizeId ?? '')
  const [colourId, setColourId] = useState(variant?.colourId ?? '')
  const [sku, setSku] = useState(variant?.sku ?? '')
  const [isActive, setIsActive] = useState(variant?.isActive ?? true)
  const [banner, setBanner] = useState<string | null>(null)

  const isPending = createVariant.isPending || updateVariant.isPending

  const submit = () => {
    setBanner(null)
    const onError = (err: unknown) => setBanner(itemErrorMessage(err, t))
    const onSuccess = () => {
      toast('success', isEdit ? t('variants.saved') : t('variants.created'))
      onDone()
    }
    if (isEdit) {
      updateVariant.mutate(
        {
          variantId: variant.id,
          input: { sku: sku.trim() || undefined, isActive },
        },
        { onSuccess, onError }
      )
      return
    }
    if (!sizeId && !colourId) {
      setBanner(t('errors.variantAttributeRequired'))
      return
    }
    createVariant.mutate(
      {
        sizeId: sizeId || undefined,
        colourId: colourId || undefined,
        sku: sku.trim() || undefined,
      },
      { onSuccess, onError }
    )
  }

  const none = t('form.none')

  return (
    <div className="space-y-4">
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      {!isEdit && (
        <div className="grid gap-4 sm:grid-cols-2">
          {item.hasSize && (
            <SelectField
              id="variant-size"
              label={t('variants.size')}
              placeholder={none}
              value={sizeId}
              onChange={(e) => setSizeId(e.target.value)}
              options={(sizes.data ?? []).map((s) => ({
                value: s.id,
                label: localizedLookupName(s, lang),
              }))}
            />
          )}
          {item.hasColour && (
            <SelectField
              id="variant-colour"
              label={t('variants.colour')}
              placeholder={none}
              value={colourId}
              onChange={(e) => setColourId(e.target.value)}
              options={(colours.data ?? []).map((c) => ({
                value: c.id,
                label: localizedLookupName(c, lang),
              }))}
            />
          )}
        </div>
      )}

      <TextField
        id="variant-sku"
        label={t('variants.sku')}
        placeholder={t('variants.skuPlaceholder')}
        value={sku}
        onChange={(e) => setSku(e.target.value)}
      />

      {isEdit && (
        <CheckboxField
          id="variant-active"
          label={t('variants.active')}
          checked={isActive}
          onCheckedChange={(v) => setIsActive(v === true)}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          {t('variants.cancel')}
        </Button>
        <Button onClick={submit} disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {t('variants.save')}
        </Button>
      </div>
    </div>
  )
}
