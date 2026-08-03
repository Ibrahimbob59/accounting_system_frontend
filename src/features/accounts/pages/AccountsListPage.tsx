import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SelectField } from '@/components/common/SelectField'
import { DataTable } from '@/components/common/DataTable'
import { AccountTree } from '@/features/accounts/components/AccountTree'
import { AccountBadges } from '@/features/accounts/components/AccountBadges'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useAccountTree } from '@/features/accounts/hooks/useAccountTree'
import { useImportOfficialChart } from '@/features/accounts/hooks/useImportOfficialChart'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  ACCOUNT_TYPES,
  localizedAccountName,
} from '@/features/accounts/types/accounts.types'
import type {
  Account,
  AccountType,
  ListAccountsQuery,
} from '@/features/accounts/types/accounts.types'
import { isPermissionDenied, usePermission } from '@/features/auth/lib/permissions'
import { confirm, toast } from '@/lib/swal'

const LIMIT = 50

type StatusFilter = 'all' | 'active' | 'inactive'

/**
 * The chart of accounts, in two views over the same data.
 *
 * Tree is the default because the official Plan Comptable Libanais is
 * meaningful as a hierarchy. The flat list exists for the case the tree is bad
 * at — finding one specific account among hundreds — which is why searching
 * switches you to it: filtering a tree either hides matching descendants or
 * shows orphaned branches, and one honest view beats two half-working ones.
 */
export function AccountsListPage() {
  const { t, i18n } = useTranslation('accounts')
  const navigate = useNavigate()
  const canCreate = usePermission('account.create')

  const [view, setView] = useState<'tree' | 'list'>('tree')
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(searchInput)

  const query: ListAccountsQuery = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      type: typeFilter === 'all' ? undefined : typeFilter,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      page,
      limit: LIMIT,
    }),
    [debouncedSearch, typeFilter, statusFilter, page]
  )

  const tree = useAccountTree()
  // The list only fetches while its tab is showing — no point paying for it
  // whenever someone is browsing the tree.
  const list = useAccounts(view === 'list' ? query : undefined)
  const importChart = useImportOfficialChart()

  const handleSearch = (value: string) => {
    setSearchInput(value)
    setPage(1)
    if (value.trim()) setView('list')
  }

  const handleImport = async () => {
    const confirmed = await confirm({
      title: t('import.confirm.title'),
      description: t('import.confirm.body'),
      confirmLabel: t('import.confirm.confirm'),
      cancelLabel: t('import.confirm.cancel'),
    })
    if (!confirmed) return
    importChart.mutate(undefined, {
      onSuccess: (result) =>
        toast('success', t('import.done', { count: result.imported })),
      onError: (err) =>
        toast(
          'error',
          isPermissionDenied(err)
            ? t('errors.permissionDenied')
            : t('errors.importFailed')
        ),
    })
  }

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: 'number',
      enableSorting: false,
      header: t('columns.number'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">{row.original.number}</span>
      ),
    },
    {
      id: 'name',
      enableSorting: false,
      header: t('columns.name'),
      cell: ({ row }) => (
        <span className="font-semibold text-text-primary">
          {localizedAccountName(row.original, i18n.language)}
        </span>
      ),
    },
    {
      id: 'type',
      enableSorting: false,
      header: t('columns.type'),
      cell: ({ row }) => t(`type.${row.original.type}`),
    },
    {
      id: 'normalBalance',
      enableSorting: false,
      header: t('columns.normalBalance'),
      cell: ({ row }) => t(`normalBalance.${row.original.normalBalance}`),
    },
    {
      id: 'flags',
      enableSorting: false,
      header: '',
      cell: ({ row }) => <AccountBadges account={row.original} />,
    },
  ]

  const meta = list.data?.meta

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
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void handleImport()}
              disabled={importChart.isPending}
            >
              {importChart.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {t('import.action')}
            </Button>
            <Button onClick={() => navigate('/app/accounts/new')}>
              <Plus className="size-4" />
              {t('newAccount')}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full space-y-2 sm:w-[280px]">
          <label htmlFor="accounts-search" className="field-label">
            {t('filters.search')}
          </label>
          <div className="field-box">
            <Search className="size-4 shrink-0 text-text-muted" />
            <Input
              id="accounts-search"
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('filters.searchPlaceholder')}
            />
          </div>
        </div>

        <SelectField
          className="w-[136px]"
          id="accounts-type-filter"
          label={t('filters.type')}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as AccountType | 'all')
            setPage(1)
            setView('list')
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            ...ACCOUNT_TYPES.map((type) => ({
              value: type,
              label: t(`type.${type}`),
            })),
          ]}
        />

        <SelectField
          className="w-[136px]"
          id="accounts-status-filter"
          label={t('filters.status')}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter)
            setPage(1)
            setView('list')
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            { value: 'active', label: t('status.active') },
            { value: 'inactive', label: t('status.inactive') },
          ]}
        />
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as 'tree' | 'list')}>
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 border-b border-border p-0"
        >
          <TabsTrigger value="tree" className="flex-none px-1 py-2.5">
            {t('views.tree')}
          </TabsTrigger>
          <TabsTrigger value="list" className="flex-none px-1 py-2.5">
            {t('views.list')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="pt-6">
          {tree.isLoading ? (
            <Centered>
              <Loader2 className="size-6 animate-spin text-brand" />
            </Centered>
          ) : tree.isError ? (
            <Centered>
              <p className="text-text-muted">
                {isPermissionDenied(tree.error)
                  ? t('errors.permissionDeniedSection')
                  : t('errors.generic')}
              </p>
            </Centered>
          ) : !tree.data?.length ? (
            <EmptyChart onImport={() => void handleImport()} canImport={canCreate} />
          ) : (
            <AccountTree nodes={tree.data} />
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4 pt-6">
          {list.isLoading ? (
            <Centered>
              <Loader2 className="size-6 animate-spin text-brand" />
            </Centered>
          ) : list.isError ? (
            <Centered>
              <p className="text-text-muted">
                {isPermissionDenied(list.error)
                  ? t('errors.permissionDeniedSection')
                  : t('errors.generic')}
              </p>
            </Centered>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={list.data?.data ?? []}
                emptyState={t('emptyFiltered')}
                onRowClick={(row) => navigate(`/app/accounts/${row.id}`)}
              />
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <span>
                    {t('pagination.summary', {
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
                      <ChevronLeft className="size-4 rtl:rotate-180" />
                      {t('pagination.prev')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {t('pagination.next')}
                      <ChevronRight className="size-4 rtl:rotate-180" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-center py-16">{children}</div>
}

/**
 * A company with no accounts can't post anything, so this state leads with the
 * official-chart import rather than "create your first account" — hand-building
 * 759 accounts is not the intended path.
 */
function EmptyChart({
  onImport,
  canImport,
}: {
  onImport: () => void
  canImport: boolean
}) {
  const { t } = useTranslation('accounts')
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-16 text-center">
      <div>
        <p className="font-medium text-text-primary">{t('empty.title')}</p>
        <p className="mt-1 text-sm text-text-secondary">{t('empty.body')}</p>
      </div>
      {canImport && (
        <Button onClick={onImport}>
          <Download className="size-4" />
          {t('import.action')}
        </Button>
      )}
    </div>
  )
}
