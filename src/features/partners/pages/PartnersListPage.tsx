import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Search, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectField } from '@/components/common/SelectField'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DataTable } from '@/components/common/DataTable'
import { PartnerTypeBadges } from '@/features/partners/components/PartnerTypeBadges'
import { usePartners } from '@/features/partners/hooks/usePartners'
import { useDebouncedValue } from '@/features/partners/hooks/useDebouncedValue'
import type { ListPartnersQuery, Partner } from '@/features/partners/types/partners.types'

type TypeFilter = 'all' | 'customer' | 'supplier'
type StatusFilter = 'all' | 'active' | 'inactive'
type SortField = 'ref' | 'name'

const LIMIT = 20

export function PartnersListPage() {
  const { t } = useTranslation('partners')
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortField>('ref')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const debouncedSearch = useDebouncedValue(searchInput)

  const query: ListPartnersQuery = useMemo(
    () => ({
      isCustomer: typeFilter === 'customer' ? true : undefined,
      isSupplier: typeFilter === 'supplier' ? true : undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      q: debouncedSearch.trim() || undefined,
      sortBy,
      sortOrder,
      page,
      limit: LIMIT,
    }),
    [typeFilter, statusFilter, debouncedSearch, sortBy, sortOrder, page]
  )

  const { data, isLoading } = usePartners(query)
  const rows = data?.data ?? []
  const meta = data?.meta

  const isUnfiltered =
    typeFilter === 'all' && statusFilter === 'all' && !debouncedSearch.trim()
  const showBigEmptyState = !isLoading && isUnfiltered && meta?.total === 0

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value)
    setPage(1)
  }

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  function sortIcon(field: SortField) {
    if (sortBy !== field) return <ChevronDown className="size-3.5 text-text-disabled" />
    return sortOrder === 'asc' ? (
      <ChevronUp className="size-3.5" />
    ) : (
      <ChevronDown className="size-3.5" />
    )
  }

  const columns: ColumnDef<Partner>[] = [
    {
      accessorKey: 'ref',
      enableSorting: false,
      header: () => (
        <button
          type="button"
          onClick={() => toggleSort('ref')}
          className="inline-flex items-center gap-1 hover:text-text-primary"
        >
          {t('list.columns.ref')}
          {sortIcon('ref')}
        </button>
      ),
    },
    {
      accessorKey: 'name',
      enableSorting: false,
      header: () => (
        <button
          type="button"
          onClick={() => toggleSort('name')}
          className="inline-flex items-center gap-1 hover:text-text-primary"
        >
          {t('list.columns.name')}
          {sortIcon('name')}
        </button>
      ),
    },
    {
      id: 'type',
      enableSorting: false,
      header: t('list.columns.type'),
      cell: ({ row }) => (
        <PartnerTypeBadges
          isCustomer={row.original.isCustomer}
          isSupplier={row.original.isSupplier}
        />
      ),
    },
    {
      accessorKey: 'phone',
      enableSorting: false,
      header: t('list.columns.phone'),
      cell: ({ getValue }) => (getValue() as string | null) ?? '—',
    },
    {
      accessorKey: 'email',
      enableSorting: false,
      header: t('list.columns.email'),
      cell: ({ getValue }) => (getValue() as string | null) ?? '—',
    },
    {
      id: 'vip',
      enableSorting: false,
      header: t('list.columns.vip'),
      cell: ({ row }) =>
        row.original.vip ? (
          <StatusBadge variant="warning">{t('list.columns.vipBadge')}</StatusBadge>
        ) : null,
    },
    {
      id: 'status',
      enableSorting: false,
      header: t('list.columns.status'),
      cell: ({ row }) =>
        row.original.isActive ? (
          <StatusBadge variant="success">{t('list.columns.active')}</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">{t('list.columns.inactive')}</StatusBadge>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          {t('list.title')}
        </h1>
        <Button onClick={() => navigate('/app/partners/new')}>
          <Plus className="size-4" />
          {t('list.newPartner')}
        </Button>
      </div>

      {showBigEmptyState ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-16 text-center">
          <UserPlus className="size-10 text-text-muted" />
          <div>
            <p className="font-medium text-text-primary">{t('list.empty.title')}</p>
            <p className="mt-1 text-sm text-text-secondary">{t('list.empty.body')}</p>
          </div>
          <Button onClick={() => navigate('/app/partners/new')}>
            <Plus className="size-4" />
            {t('list.empty.cta')}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full max-w-xs space-y-1">
              <label htmlFor="partners-search" className="field-label text-sm font-medium">
                {t('list.filters.search')}
              </label>
              <div className="field-line">
                <Search className="ms-2 size-4 shrink-0 text-text-muted" />
                <Input
                  id="partners-search"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value)
                    setPage(1)
                  }}
                  placeholder={t('list.filters.searchPlaceholder')}
                  className="border-0"
                />
              </div>
            </div>

            <SelectField
              id="partners-type-filter"
              label={t('list.filters.type')}
              value={typeFilter}
              onChange={(e) => updateFilter(setTypeFilter, e.target.value as TypeFilter)}
              options={[
                { value: 'all', label: t('list.filters.typeAll') },
                { value: 'customer', label: t('list.filters.typeCustomer') },
                { value: 'supplier', label: t('list.filters.typeSupplier') },
              ]}
            />

            <SelectField
              id="partners-status-filter"
              label={t('list.filters.status')}
              value={statusFilter}
              onChange={(e) => updateFilter(setStatusFilter, e.target.value as StatusFilter)}
              options={[
                { value: 'all', label: t('list.filters.statusAll') },
                { value: 'active', label: t('list.filters.statusActive') },
                { value: 'inactive', label: t('list.filters.statusInactive') },
              ]}
            />
          </div>

          <DataTable
            columns={columns}
            data={rows}
            emptyState={t('list.filteredEmpty')}
            onRowClick={(row) => navigate(`/app/partners/${row.id}`)}
          />

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>
                {t('list.pagination.summary', {
                  page: meta.page,
                  totalPages: meta.totalPages,
                  total: meta.total,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  {t('list.pagination.prev')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('list.pagination.next')}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
