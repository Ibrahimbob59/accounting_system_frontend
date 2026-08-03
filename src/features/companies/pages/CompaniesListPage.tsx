import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Check, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useCompanies } from '@/features/companies/hooks/useCompanies'
import { monthName } from '@/features/companies/types/companies.types'
import type { Company } from '@/features/companies/types/companies.types'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { isPermissionDenied, usePermission } from '@/features/auth/lib/permissions'

const LIMIT = 20

/**
 * Every company the caller can see — for a normal user that's the companies
 * they belong to, for a platform admin it's the whole tenant list. The backend
 * scopes `GET /companies` by caller, so this screen doesn't branch on role.
 *
 * Distinct from `/select-company`, which is an auth step that switches the
 * active company and moves on. This is the management view: what these
 * companies are, and how to create or edit one.
 */
export function CompaniesListPage() {
  const { t, i18n } = useTranslation('companies')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId)
  const canCreate = usePermission('company.create')

  const { data, isLoading, isError, error } = useCompanies({
    page,
    limit: LIMIT,
  })
  const meta = data?.meta

  const columns: ColumnDef<Company>[] = [
    {
      id: 'name',
      enableSorting: false,
      header: t('columns.name'),
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <span className="font-semibold text-text-primary">
            {row.original.name}
          </span>
          {/* Which company you're currently working in is the single most
              useful thing on this screen — without it the rows are anonymous. */}
          {row.original.id === activeCompanyId && (
            <StatusBadge variant="success">
              <Check className="size-3" />
              {t('active')}
            </StatusBadge>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'taxNumber',
      enableSorting: false,
      header: t('columns.taxNumber'),
      cell: ({ getValue }) => (getValue() as string | null) ?? '—',
    },
    {
      accessorKey: 'baseCurrencyCode',
      enableSorting: false,
      header: t('columns.baseCurrency'),
    },
    {
      id: 'fiscalYearStartMonth',
      enableSorting: false,
      header: t('columns.fiscalYearStart'),
      cell: ({ row }) =>
        monthName(row.original.fiscalYearStartMonth, i18n.language),
    },
    {
      id: 'status',
      enableSorting: false,
      header: t('columns.status'),
      cell: ({ row }) =>
        row.original.isActive ? (
          <StatusBadge variant="success">{t('status.active')}</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">{t('status.inactive')}</StatusBadge>
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
          <Button onClick={() => navigate('/app/companies/new')}>
            <Plus className="size-4" />
            {t('newCompany')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-text-muted">
          {isPermissionDenied(error)
            ? t('errors.permissionDeniedSection')
            : t('errors.generic')}
        </p>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            emptyState={t('empty')}
            onRowClick={(row) => navigate(`/app/companies/${row.id}`)}
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
    </div>
  )
}
