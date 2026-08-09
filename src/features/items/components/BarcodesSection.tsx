import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { BarcodeFormModal } from '@/features/items/components/BarcodeFormModal'
import {
  useBarcodes,
  useDeleteBarcode,
} from '@/features/items/hooks/useBarcodes'
import { useVariants } from '@/features/items/hooks/useVariants'
import { itemErrorMessage } from '@/features/items/lib/item-errors'
import type {
  Item,
  ItemBarcode,
  ItemVariant,
} from '@/features/items/types/items.types'
import { useLookups } from '@/features/catalog/hooks/useLookups'
import { localizedLookupName } from '@/features/catalog/types/catalog.types'
import { usePermission } from '@/features/auth/lib/permissions'
import { confirm, toast } from '@/lib/swal'

export function BarcodesSection({ item }: { item: Item }) {
  const { t, i18n } = useTranslation('items')
  const lang = i18n.language

  const canCreate = usePermission('item.create')
  const canUpdate = usePermission('item.update')
  const canDelete = usePermission('item.delete')

  const barcodes = useBarcodes(item.id)
  const variants = useVariants(item.id)
  const sizes = useLookups('size')
  const colours = useLookups('colour')
  const deleteBarcode = useDeleteBarcode(item.id)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ItemBarcode | undefined>()

  const variantLabel = (v: ItemVariant) => {
    const parts = [
      v.sizeId ? sizes.data?.find((s) => s.id === v.sizeId) : null,
      v.colourId ? colours.data?.find((c) => c.id === v.colourId) : null,
    ]
      .filter((x): x is NonNullable<typeof x> => !!x)
      .map((x) => localizedLookupName(x, lang))
    return parts.join(' / ') || v.sku || t('barcodes.variantGeneric')
  }

  const variantOptions = (variants.data ?? []).map((v) => ({
    value: v.id,
    label: variantLabel(v),
  }))
  const variantNameById = (id: string | null) => {
    if (!id) return t('barcodes.itemLevel')
    const v = variants.data?.find((x) => x.id === id)
    return v ? variantLabel(v) : '—'
  }

  const handleDelete = async (b: ItemBarcode) => {
    const ok = await confirm({
      title: t('barcodes.deleteConfirm.title'),
      description: t('barcodes.deleteConfirm.body', { code: b.barcode }),
      confirmLabel: t('barcodes.deleteConfirm.confirm'),
      cancelLabel: t('barcodes.deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteBarcode.mutate(b.id, {
      onSuccess: () => toast('success', t('barcodes.deleted')),
      onError: (err) => toast('error', itemErrorMessage(err, t)),
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('barcodes.title')}
        </h2>
        {canCreate && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" />
            {t('barcodes.add')}
          </Button>
        )}
      </div>

      {barcodes.isLoading ? (
        <div className="flex py-6">
          <Loader2 className="size-5 animate-spin text-brand" />
        </div>
      ) : !barcodes.data?.length ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-text-muted">
          {t('barcodes.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('barcodes.code')}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  {t('barcodes.variant')}
                </th>
                <th className="w-1 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {barcodes.data.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[13px] text-text-primary">
                      {b.barcode}
                    </span>
                    {b.isPrimary && (
                      <StatusBadge variant="info" className="ms-2">
                        {t('barcodes.primary')}
                      </StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">
                    {variantNameById(b.variantId)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('barcodes.edit')}
                          onClick={() => {
                            setEditing(b)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('barcodes.delete')}
                          disabled={deleteBarcode.isPending}
                          onClick={() => void handleDelete(b)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BarcodeFormModal
        itemId={item.id}
        variantOptions={variantOptions}
        barcode={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </section>
  )
}
