import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SelectField } from '@/components/common/SelectField'
import { DataTable } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import { useItems } from '@/features/items/hooks/useItems'
import {
  localizedItemName,
  type Item,
  type ListItemsQuery,
} from '@/features/items/types/items.types'
import { useItemCategories } from '@/features/catalog/hooks/useLookups'
import { localizedLookupName } from '@/features/catalog/types/catalog.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatMoney } from '@/lib/format'

const LIMIT = 50

type StatusFilter = 'all' | 'active' | 'inactive'

export function ItemsListPage() {
  const { t, i18n } = useTranslation('items')
  const navigate = useNavigate()
  const canCreate = usePermission('item.create')

  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(searchInput)
  const categories = useItemCategories()
  const lookupCurrency = useCurrencyLookup()

  const query: ListItemsQuery = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      page,
      limit: LIMIT,
    }),
    [debouncedSearch, categoryFilter, statusFilter, page]
  )

  const list = useItems(query)
  const meta = list.data?.meta

  const categoryName = (id: string | null) => {
    if (!id) return '—'
    const c = categories.data?.find((x) => x.id === id)
    return c ? localizedLookupName(c, i18n.language) : '—'
  }

  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: 'code',
      enableSorting: false,
      header: t('columns.code'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">{row.original.code}</span>
      ),
    },
    {
      id: 'name',
      enableSorting: false,
      header: t('columns.name'),
      cell: ({ row }) => (
        <span className="font-semibold text-text-primary">
          {localizedItemName(row.original, i18n.language)}
        </span>
      ),
    },
    {
      id: 'category',
      enableSorting: false,
      header: t('columns.category'),
      cell: ({ row }) => categoryName(row.original.categoryId),
    },
    {
      id: 'salePrice',
      enableSorting: false,
      header: t('columns.salePrice'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">
          {formatMoney(
            row.original.salePrice,
            lookupCurrency(row.original.priceCurrency),
            i18n.language
          )}
        </span>
      ),
    },
    {
      id: 'flags',
      enableSorting: false,
      header: '',
      cell: ({ row }) => (
        <span className="inline-flex flex-wrap items-center gap-1">
          {!row.original.trackInventory && (
            <StatusBadge variant="info">{t('badges.service')}</StatusBadge>
          )}
          {!row.original.isActive && (
            <StatusBadge variant="neutral">{t('status.inactive')}</StatusBadge>
          )}
        </span>
      ),
    },
  ]

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
          <Button onClick={() => navigate('/app/items/new')}>
            <Plus className="size-4" />
            {t('newItem')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full space-y-2 sm:w-[280px]">
          <label htmlFor="items-search" className="field-label">
            {t('filters.search')}
          </label>
          <div className="field-box">
            <Search className="size-4 shrink-0 text-text-muted" />
            <Input
              id="items-search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              placeholder={t('filters.searchPlaceholder')}
            />
          </div>
        </div>

        <SelectField
          className="w-[180px]"
          id="items-category-filter"
          label={t('filters.category')}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            ...(categories.data ?? []).map((c) => ({
              value: c.id,
              label: localizedLookupName(c, i18n.language),
            })),
          ]}
        />

        <SelectField
          className="w-[136px]"
          id="items-status-filter"
          label={t('filters.status')}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter)
            setPage(1)
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            { value: 'active', label: t('status.active') },
            { value: 'inactive', label: t('status.inactive') },
          ]}
        />
      </div>

      {list.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : list.isError ? (
        <p className="py-8 text-center text-text-muted">
          {isPermissionDenied(list.error)
            ? t('errors.permissionDeniedSection')
            : t('errors.generic')}
        </p>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={list.data?.data ?? []}
            emptyState={t('empty')}
            onRowClick={(row) => navigate(`/app/items/${row.id}`)}
          />
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </div>
      )}
    </div>
  )
}
