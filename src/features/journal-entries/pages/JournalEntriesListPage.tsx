import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/common/SelectField'
import { DataTable } from '@/components/common/DataTable'
import { JournalStatusBadge } from '@/features/journal-entries/components/JournalStatusBadge'
import { useJournalEntries } from '@/features/journal-entries/hooks/useJournalEntries'
import {
  JOURNAL_STATUSES,
  type JournalEntry,
  type JournalStatus,
  type ListJournalEntriesQuery,
} from '@/features/journal-entries/types/journal-entries.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'

const LIMIT = 50

type StatusFilter = 'all' | JournalStatus

/**
 * The journal — every manual GL posting, newest activity first. Creating an
 * entry is a draft; posting and reversing happen from the detail page.
 */
export function JournalEntriesListPage() {
  const { t, i18n } = useTranslation('journalEntries')
  const navigate = useNavigate()
  const canCreate = usePermission('journalentry.create')

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const lookupCurrency = useCurrencyLookup()

  const query: ListJournalEntriesQuery = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: LIMIT,
    }),
    [statusFilter, dateFrom, dateTo, page]
  )

  const list = useJournalEntries(query)
  const meta = list.data?.meta

  const columns: ColumnDef<JournalEntry>[] = [
    {
      id: 'entryNumber',
      enableSorting: false,
      header: t('columns.number'),
      cell: ({ row }) =>
        row.original.entryNumber ? (
          <span className="font-mono text-[13px]">
            {row.original.entryNumber}
          </span>
        ) : (
          <span className="text-text-muted">{t('draftPlaceholder')}</span>
        ),
    },
    {
      id: 'date',
      enableSorting: false,
      header: t('columns.date'),
      cell: ({ row }) => formatDate(row.original.date, i18n.language),
    },
    {
      id: 'description',
      enableSorting: false,
      header: t('columns.description'),
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-text-primary">
            {row.original.description || t('noDescription')}
          </p>
          {row.original.reference && (
            <p className="truncate text-[13px] text-text-muted">
              {row.original.reference}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'amount',
      enableSorting: false,
      header: t('columns.amount'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px] text-text-primary">
          {formatMoney(
            row.original.totalDebitBase,
            row.original.baseCurrencyCode
              ? lookupCurrency(row.original.baseCurrencyCode)
              : undefined,
            i18n.language
          )}
        </span>
      ),
    },
    {
      id: 'status',
      enableSorting: false,
      header: t('columns.status'),
      cell: ({ row }) => (
        <JournalStatusBadge
          status={row.original.status}
          isReversal={!!row.original.reversalOfId}
        />
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
          <Button onClick={() => navigate('/app/journal-entries/new')}>
            <Plus className="size-4" />
            {t('newEntry')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          className="w-[150px]"
          id="je-status-filter"
          label={t('filters.status')}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter)
            setPage(1)
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            ...JOURNAL_STATUSES.map((status) => ({
              value: status,
              label: t(`status.${status}`),
            })),
          ]}
        />

        <div className="w-full space-y-2 sm:w-[170px]">
          <Label htmlFor="je-date-from" className="field-label">
            {t('filters.dateFrom')}
          </Label>
          <div className="field-box">
            <Input
              id="je-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        <div className="w-full space-y-2 sm:w-[170px]">
          <Label htmlFor="je-date-to" className="field-label">
            {t('filters.dateTo')}
          </Label>
          <div className="field-box">
            <Input
              id="je-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
      </div>

      {list.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : list.isError ? (
        <div className="flex justify-center py-16">
          <p className="text-text-muted">
            {isPermissionDenied(list.error)
              ? t('errors.permissionDeniedSection')
              : t('errors.generic')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={list.data?.data ?? []}
            emptyState={t('empty')}
            onRowClick={(row) => navigate(`/app/journal-entries/${row.id}`)}
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
        </div>
      )}
    </div>
  )
}
