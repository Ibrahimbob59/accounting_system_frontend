import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/common/Modal'
import { CheckboxField } from '@/components/common/CheckboxField'
import { FormBanner } from '@/components/common/FormBanner'
import { useGenerateVariants } from '@/features/items/hooks/useVariants'
import { itemErrorMessage } from '@/features/items/lib/item-errors'
import type { Item } from '@/features/items/types/items.types'
import { useLookups } from '@/features/catalog/hooks/useLookups'
import { localizedLookupName } from '@/features/catalog/types/catalog.types'
import { toast } from '@/lib/swal'

/**
 * Generate the size × colour matrix in one go — every combination of the ticked
 * sizes and colours. Combinations that already exist are skipped server-side, so
 * this is safe to re-run after adding a new size or colour.
 */
export function GenerateVariantsModal({
  item,
  open,
  onOpenChange,
}: {
  item: Item
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('items')
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('variants.generateTitle')}
      description={t('variants.generateBody')}
    >
      {open && <Body item={item} onDone={() => onOpenChange(false)} />}
    </Modal>
  )
}

function Body({ item, onDone }: { item: Item; onDone: () => void }) {
  const { t, i18n } = useTranslation('items')
  const lang = i18n.language
  const sizes = useLookups('size')
  const colours = useLookups('colour')
  const generate = useGenerateVariants(item.id)

  const [sizeIds, setSizeIds] = useState<string[]>([])
  const [colourIds, setColourIds] = useState<string[]>([])
  const [banner, setBanner] = useState<string | null>(null)

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const canGenerate =
    (item.hasSize ? sizeIds.length > 0 : true) &&
    (item.hasColour ? colourIds.length > 0 : true) &&
    sizeIds.length + colourIds.length > 0

  const submit = () => {
    setBanner(null)
    generate.mutate(
      {
        sizeIds: sizeIds.length ? sizeIds : undefined,
        colourIds: colourIds.length ? colourIds : undefined,
      },
      {
        onSuccess: (res) => {
          toast(
            'success',
            t('variants.generated', {
              created: res.created,
              skipped: res.skipped,
            })
          )
          onDone()
        },
        onError: (err) => setBanner(itemErrorMessage(err, t)),
      }
    )
  }

  return (
    <div className="space-y-4">
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <div className="grid gap-6 sm:grid-cols-2">
        {item.hasSize && (
          <div className="space-y-2">
            <p className="field-label">{t('variants.sizes')}</p>
            {(sizes.data ?? []).map((s) => (
              <CheckboxField
                key={s.id}
                id={`gen-size-${s.id}`}
                label={localizedLookupName(s, lang)}
                checked={sizeIds.includes(s.id)}
                onCheckedChange={() => toggle(sizeIds, setSizeIds, s.id)}
              />
            ))}
            {!sizes.data?.length && (
              <p className="text-[13px] text-text-muted">
                {t('variants.noSizes')}
              </p>
            )}
          </div>
        )}
        {item.hasColour && (
          <div className="space-y-2">
            <p className="field-label">{t('variants.colours')}</p>
            {(colours.data ?? []).map((c) => (
              <CheckboxField
                key={c.id}
                id={`gen-colour-${c.id}`}
                label={localizedLookupName(c, lang)}
                checked={colourIds.includes(c.id)}
                onCheckedChange={() => toggle(colourIds, setColourIds, c.id)}
              />
            ))}
            {!colours.data?.length && (
              <p className="text-[13px] text-text-muted">
                {t('variants.noColours')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          {t('variants.cancel')}
        </Button>
        <Button onClick={submit} disabled={!canGenerate || generate.isPending}>
          {generate.isPending && <Loader2 className="animate-spin" />}
          {t('variants.generate')}
        </Button>
      </div>
    </div>
  )
}
