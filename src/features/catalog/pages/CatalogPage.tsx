import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LookupFormModal } from '@/features/catalog/components/LookupFormModal'
import { useLookups } from '@/features/catalog/hooks/useLookups'
import { useDeleteLookup } from '@/features/catalog/hooks/useLookupMutations'
import { catalogErrorMessage } from '@/features/catalog/lib/catalog-errors'
import {
  LOOKUP_KINDS,
  localizedLookupName,
  type CatalogLookup,
  type LookupKind,
} from '@/features/catalog/types/catalog.types'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { confirm, toast } from '@/lib/swal'

export function CatalogPage() {
  const { t, i18n } = useTranslation('catalog')
  const lang = i18n.language

  const [kind, setKind] = useState<LookupKind>('itemCategory')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogLookup | undefined>()

  const canCreate = usePermission('item.create')
  const canUpdate = usePermission('item.update')
  const canDelete = usePermission('item.delete')

  const lookups = useLookups(kind)
  const accounts = useAllAccounts()
  const deleteLookup = useDeleteLookup(kind)

  const isCategory = kind === 'itemCategory'

  const openCreate = () => {
    setEditing(undefined)
    setModalOpen(true)
  }
  const openEdit = (lookup: CatalogLookup) => {
    setEditing(lookup)
    setModalOpen(true)
  }

  const handleDelete = async (lookup: CatalogLookup) => {
    const ok = await confirm({
      title: t('deleteConfirm.title'),
      description: t('deleteConfirm.body', {
        name: localizedLookupName(lookup, lang),
      }),
      confirmLabel: t('deleteConfirm.confirm'),
      cancelLabel: t('deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteLookup.mutate(lookup.id, {
      onSuccess: () => toast('success', t('deleted')),
      onError: (err) => toast('error', catalogErrorMessage(err, t)),
    })
  }

  const accountLabel = (id: string | null | undefined) => {
    if (!id) return t('table.accountDefault')
    const a = accounts.data?.find((x) => x.id === id)
    return a ? a.number : '—'
  }
  const parentName = (id: string | null | undefined) => {
    if (!id) return '—'
    const p = lookups.data?.find((x) => x.id === id)
    return p ? localizedLookupName(p, lang) : '—'
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
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t('add', { kind: t(`kinds.${kind}`) })}
          </Button>
        )}
      </div>

      <Tabs value={kind} onValueChange={(v) => setKind(v as LookupKind)}>
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 overflow-x-auto border-b border-border p-0"
        >
          {LOOKUP_KINDS.map((k) => (
            <TabsTrigger key={k} value={k} className="flex-none px-1 py-2.5">
              {t(`kindsPlural.${k}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {lookups.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : lookups.isError ? (
        <p className="py-8 text-center text-text-muted">
          {isPermissionDenied(lookups.error)
            ? t('errors.permissionDeniedSection')
            : t('errors.generic')}
        </p>
      ) : !lookups.data?.length ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-text-muted">
          {t('empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">{t('table.name')}</th>
                {isCategory && (
                  <>
                    <th className="px-4 py-2.5 font-medium">
                      {t('table.parent')}
                    </th>
                    <th className="px-4 py-2.5 font-medium">
                      {t('table.revenue')}
                    </th>
                    <th className="px-4 py-2.5 font-medium">
                      {t('table.cogs')}
                    </th>
                  </>
                )}
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('table.sortOrder')}
                </th>
                <th className="w-1 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {lookups.data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-2.5 font-medium text-text-primary">
                    {localizedLookupName(row, lang)}
                  </td>
                  {isCategory && (
                    <>
                      <td className="px-4 py-2.5 text-text-muted">
                        {parentName(row.parentId)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[13px] text-text-muted">
                        {accountLabel(row.revenueAccountId)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[13px] text-text-muted">
                        {accountLabel(row.cogsAccountId)}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-2.5 text-end font-mono text-[13px] text-text-muted">
                    {row.sortOrder}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('actions.edit')}
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('actions.delete')}
                          disabled={deleteLookup.isPending}
                          onClick={() => void handleDelete(row)}
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

      <LookupFormModal
        kind={kind}
        lookup={editing}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
