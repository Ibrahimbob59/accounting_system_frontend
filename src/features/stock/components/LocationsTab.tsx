import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LocationFormModal } from '@/features/stock/components/LocationFormModal'
import {
  useLocations,
  useDeleteLocation,
} from '@/features/stock/hooks/useLocations'
import { stockErrorMessage } from '@/features/stock/lib/stock-errors'
import {
  localizedLocationName,
  type StockLocation,
} from '@/features/stock/types/stock.types'
import { useBranches } from '@/features/branches/hooks/useBranches'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { confirm, toast } from '@/lib/swal'

export function LocationsTab() {
  const { t, i18n } = useTranslation('stock')
  const lang = i18n.language

  const canCreate = usePermission('stock.create')
  const canUpdate = usePermission('stock.update')
  const canDelete = usePermission('stock.delete')

  // Only INTERNAL locations are user-managed; the virtual ones are read-only.
  const locations = useLocations({ type: 'INTERNAL' })
  const branches = useBranches()
  const deleteLocation = useDeleteLocation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StockLocation | undefined>()

  const branchName = (id: string | null) =>
    id ? (branches.data?.find((b) => b.id === id)?.name ?? '—') : '—'

  const handleDelete = async (l: StockLocation) => {
    const ok = await confirm({
      title: t('locations.deleteConfirm.title'),
      description: t('locations.deleteConfirm.body', {
        name: localizedLocationName(l, lang),
      }),
      confirmLabel: t('locations.deleteConfirm.confirm'),
      cancelLabel: t('locations.deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteLocation.mutate(l.id, {
      onSuccess: () => toast('success', t('locations.deleted')),
      onError: (err) => toast('error', stockErrorMessage(err, t)),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[15px] text-text-muted">{t('locations.subtitle')}</p>
        {canCreate && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setModalOpen(true)
            }}
          >
            <Plus className="size-4" />
            {t('locations.add')}
          </Button>
        )}
      </div>

      {locations.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : locations.isError ? (
        <p className="py-8 text-center text-text-muted">
          {isPermissionDenied(locations.error)
            ? t('errors.permissionDeniedSection')
            : t('errors.generic')}
        </p>
      ) : !locations.data?.length ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-text-muted">
          {t('locations.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('locations.code')}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  {t('locations.name')}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  {t('locations.branch')}
                </th>
                <th className="w-1 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {locations.data.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[13px]">{l.code}</span>
                    {!l.isActive && (
                      <StatusBadge variant="neutral" className="ms-2">
                        {t('locations.inactive')}
                      </StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-text-primary">
                    {localizedLocationName(l, lang)}
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">
                    {branchName(l.branchId)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('locations.edit')}
                          onClick={() => {
                            setEditing(l)
                            setModalOpen(true)
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('locations.delete')}
                          disabled={deleteLocation.isPending}
                          onClick={() => void handleDelete(l)}
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

      <LocationFormModal
        location={editing}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
