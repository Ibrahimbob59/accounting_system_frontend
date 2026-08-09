import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UomCategoryFormModal } from '@/features/uom/components/UomCategoryFormModal'
import { UomFormModal } from '@/features/uom/components/UomFormModal'
import { ConvertCard } from '@/features/uom/components/ConvertCard'
import { useUoms, useUomCategories } from '@/features/uom/hooks/useUoms'
import {
  useDeleteUom,
  useDeleteUomCategory,
} from '@/features/uom/hooks/useUomMutations'
import { uomErrorMessage } from '@/features/uom/lib/uom-errors'
import {
  localizedUomName,
  type Uom,
  type UomCategory,
} from '@/features/uom/types/uom.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { confirm, toast } from '@/lib/swal'

export function UomPage() {
  const { t, i18n } = useTranslation('uom')
  const lang = i18n.language

  const canCreate = usePermission('uom.create')
  const canUpdate = usePermission('uom.update')
  const canDelete = usePermission('uom.delete')

  const categories = useUomCategories()
  const [activeId, setActiveId] = useState<string | undefined>()
  const selectedId = activeId ?? categories.data?.[0]?.id
  const selected = categories.data?.find((c) => c.id === selectedId)

  const units = useUoms(selectedId)
  const deleteCategory = useDeleteUomCategory()
  const deleteUom = useDeleteUom()

  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<UomCategory | undefined>()
  const [unitModal, setUnitModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Uom | undefined>()

  const openNewCategory = () => {
    setEditingCat(undefined)
    setCatModal(true)
  }
  const openEditCategory = (c: UomCategory) => {
    setEditingCat(c)
    setCatModal(true)
  }
  const openNewUnit = () => {
    setEditingUnit(undefined)
    setUnitModal(true)
  }
  const openEditUnit = (u: Uom) => {
    setEditingUnit(u)
    setUnitModal(true)
  }

  const handleDeleteCategory = async (c: UomCategory) => {
    const ok = await confirm({
      title: t('category.deleteConfirm.title'),
      description: t('category.deleteConfirm.body', {
        name: localizedUomName(c, lang),
      }),
      confirmLabel: t('category.deleteConfirm.confirm'),
      cancelLabel: t('category.deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteCategory.mutate(c.id, {
      onSuccess: () => {
        toast('success', t('category.deleted'))
        setActiveId(undefined)
      },
      onError: (err) => toast('error', uomErrorMessage(err, t)),
    })
  }

  const handleDeleteUnit = async (u: Uom) => {
    const ok = await confirm({
      title: t('unit.deleteConfirm.title'),
      description: t('unit.deleteConfirm.body', {
        name: localizedUomName(u, lang),
      }),
      confirmLabel: t('unit.deleteConfirm.confirm'),
      cancelLabel: t('unit.deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteUom.mutate(u.id, {
      onSuccess: () => toast('success', t('unit.deleted')),
      onError: (err) => toast('error', uomErrorMessage(err, t)),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {t('title')}
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">{t('subtitle')}</p>
        </div>
        {canCreate && (
          <Button onClick={openNewCategory}>
            <Plus className="size-4" />
            {t('category.add')}
          </Button>
        )}
      </div>

      {categories.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : categories.isError ? (
        <p className="py-8 text-center text-text-muted">
          {isPermissionDenied(categories.error)
            ? t('errors.permissionDeniedSection')
            : t('errors.generic')}
        </p>
      ) : !categories.data?.length ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-text-muted">
          {t('category.empty')}
        </p>
      ) : (
        <>
          <Tabs value={selectedId} onValueChange={(v) => setActiveId(v)}>
            <TabsList
              variant="line"
              className="h-auto w-full justify-start gap-6 overflow-x-auto border-b border-border p-0"
            >
              {categories.data.map((c) => (
                <TabsTrigger
                  key={c.id}
                  value={c.id}
                  className="flex-none px-1 py-2.5"
                >
                  {localizedUomName(c, lang)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {selected && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold text-text-primary">
                {localizedUomName(selected, lang)}
              </h2>
              <div className="flex flex-wrap gap-2">
                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditCategory(selected)}
                  >
                    <Pencil className="size-4" />
                    {t('category.edit')}
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDeleteCategory(selected)}
                  >
                    <Trash2 className="size-4" />
                    {t('category.delete')}
                  </Button>
                )}
                {canCreate && (
                  <Button size="sm" onClick={openNewUnit}>
                    <Plus className="size-4" />
                    {t('unit.add')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {units.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-brand" />
            </div>
          ) : !units.data?.length ? (
            <p className="rounded-lg border border-dashed border-border py-12 text-center text-text-muted">
              {t('unit.empty')}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                    <th className="px-4 py-2.5 font-medium">
                      {t('unit.name')}
                    </th>
                    <th className="px-4 py-2.5 font-medium">
                      {t('unit.type')}
                    </th>
                    <th className="px-4 py-2.5 text-end font-medium">
                      {t('unit.factor')}
                    </th>
                    <th className="px-4 py-2.5 text-end font-medium">
                      {t('unit.rounding')}
                    </th>
                    <th className="w-1 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {units.data.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-text-primary">
                          {localizedUomName(u, lang)}
                        </span>
                        {!u.isActive && (
                          <StatusBadge variant="neutral" className="ms-2">
                            {t('unit.inactive')}
                          </StatusBadge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-text-muted">
                        {t(`type.${u.type}`)}
                      </td>
                      <td className="px-4 py-2.5 text-end font-mono text-[13px]">
                        {u.factor}
                      </td>
                      <td className="px-4 py-2.5 text-end font-mono text-[13px] text-text-muted">
                        {u.rounding}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t('unit.edit')}
                              onClick={() => openEditUnit(u)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t('unit.delete')}
                              disabled={deleteUom.isPending}
                              onClick={() => void handleDeleteUnit(u)}
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

          {selectedId && (units.data?.length ?? 0) >= 2 && (
            <ConvertCard units={units.data ?? []} />
          )}
        </>
      )}

      <UomCategoryFormModal
        category={editingCat}
        open={catModal}
        onOpenChange={setCatModal}
      />
      {selectedId && (
        <UomFormModal
          categoryId={selectedId}
          uom={editingUnit}
          open={unitModal}
          onOpenChange={setUnitModal}
        />
      )}
    </div>
  )
}
