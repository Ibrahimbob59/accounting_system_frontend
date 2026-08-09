import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { VariantFormModal } from '@/features/items/components/VariantFormModal'
import { GenerateVariantsModal } from '@/features/items/components/GenerateVariantsModal'
import {
  useVariants,
  useDeleteVariant,
} from '@/features/items/hooks/useVariants'
import { itemErrorMessage } from '@/features/items/lib/item-errors'
import type { Item, ItemVariant } from '@/features/items/types/items.types'
import { useLookups } from '@/features/catalog/hooks/useLookups'
import { localizedLookupName } from '@/features/catalog/types/catalog.types'
import { usePermission } from '@/features/auth/lib/permissions'
import { confirm, toast } from '@/lib/swal'

export function VariantsSection({ item }: { item: Item }) {
  const { t, i18n } = useTranslation('items')
  const lang = i18n.language

  const canCreate = usePermission('item.create')
  const canUpdate = usePermission('item.update')
  const canDelete = usePermission('item.delete')

  const variants = useVariants(item.id)
  const sizes = useLookups('size')
  const colours = useLookups('colour')
  const deleteVariant = useDeleteVariant(item.id)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ItemVariant | undefined>()
  const [genOpen, setGenOpen] = useState(false)

  const sizeName = (id: string | null) =>
    id ? (sizes.data?.find((s) => s.id === id) ?? null) : null
  const colourName = (id: string | null) =>
    id ? (colours.data?.find((c) => c.id === id) ?? null) : null

  const handleDelete = async (v: ItemVariant) => {
    const ok = await confirm({
      title: t('variants.deleteConfirm.title'),
      description: t('variants.deleteConfirm.body'),
      confirmLabel: t('variants.deleteConfirm.confirm'),
      cancelLabel: t('variants.deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteVariant.mutate(v.id, {
      onSuccess: () => toast('success', t('variants.deleted')),
      onError: (err) => toast('error', itemErrorMessage(err, t)),
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('variants.title')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGenOpen(true)}
              >
                <LayoutGrid className="size-4" />
                {t('variants.generate')}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(undefined)
                  setFormOpen(true)
                }}
              >
                <Plus className="size-4" />
                {t('variants.add')}
              </Button>
            </>
          )}
        </div>
      </div>

      {variants.isLoading ? (
        <div className="flex py-6">
          <Loader2 className="size-5 animate-spin text-brand" />
        </div>
      ) : !variants.data?.length ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-text-muted">
          {t('variants.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('variants.size')}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  {t('variants.colour')}
                </th>
                <th className="px-4 py-2.5 font-medium">{t('variants.sku')}</th>
                <th className="w-1 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {variants.data.map((v) => {
                const size = sizeName(v.sizeId)
                const colour = colourName(v.colourId)
                return (
                  <tr
                    key={v.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-2.5 text-text-primary">
                      {size ? localizedLookupName(size, lang) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-text-primary">
                      {colour ? localizedLookupName(colour, lang) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[13px] text-text-muted">
                        {v.sku || '—'}
                      </span>
                      {!v.isActive && (
                        <StatusBadge variant="neutral" className="ms-2">
                          {t('status.inactive')}
                        </StatusBadge>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('variants.edit')}
                            onClick={() => {
                              setEditing(v)
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
                            aria-label={t('variants.delete')}
                            disabled={deleteVariant.isPending}
                            onClick={() => void handleDelete(v)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <VariantFormModal
        item={item}
        variant={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
      <GenerateVariantsModal
        item={item}
        open={genOpen}
        onOpenChange={setGenOpen}
      />
    </section>
  )
}
