import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SelectField } from '@/components/common/SelectField'
import { DataTable } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import { StockTransferStatusBadge } from '@/features/stock/components/StockTransferStatusBadge'
import { useStockTransfers } from '@/features/stock/hooks/useStockTransfers'
import { useLocations } from '@/features/stock/hooks/useLocations'
import {
  STOCK_TRANSFER_STATUSES,
  type ListStockTransfersQuery,
  type StockTransfer,
  type StockTransferStatus,
} from '@/features/stock/types/stock-ops.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { formatDate } from '@/lib/format'

const LIMIT = 20

export function StockTransfersListPage() {
  const { t, i18n } = useTranslation('stockOps')
  const navigate = useNavigate()
  const canCreate = usePermission('stock.create')

  const [status, setStatus] = useState<'all' | StockTransferStatus>('all')
  const [page, setPage] = useState(1)

  const locations = useLocations({ type: 'INTERNAL' })
  const locationCode = (id: string) =>
    locations.data?.find((l) => l.id === id)?.code ?? id.slice(0, 8)

  const query: ListStockTransfersQuery = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      page,
      limit: LIMIT,
    }),
    [status, page]
  )
  const list = useStockTransfers(query)
  const meta = list.data?.meta

  const columns: ColumnDef<StockTransfer>[] = [
    {
      id: 'transferNo',
      enableSorting: false,
      header: t('transfer.columns.number'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">{row.original.transferNo}</span>
      ),
    },
    {
      id: 'date',
      enableSorting: false,
      header: t('transfer.columns.date'),
      cell: ({ row }) => formatDate(row.original.transferDate, i18n.language),
    },
    {
      id: 'from',
      enableSorting: false,
      header: t('transfer.columns.from'),
      cell: ({ row }) => locationCode(row.original.fromLocationId),
    },
    {
      id: 'to',
      enableSorting: false,
      header: t('transfer.columns.to'),
      cell: ({ row }) => locationCode(row.original.toLocationId),
    },
    {
      id: 'status',
      enableSorting: false,
      header: t('transfer.columns.status'),
      cell: ({ row }) => (
        <StockTransferStatusBadge status={row.original.status} />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {t('transfer.list.title')}
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">
            {t('transfer.list.subtitle')}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/app/stock-transfers/new')}>
            <Plus className="size-4" />
            {t('transfer.list.new')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          className="w-[180px]"
          id="trf-f-status"
          label={t('filters.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'all' | StockTransferStatus)
            setPage(1)
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            ...STOCK_TRANSFER_STATUSES.map((s) => ({
              value: s,
              label: t(`transfer.status.${s}`),
            })),
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
            emptyState={t('transfer.list.empty')}
            onRowClick={(row) => navigate(`/app/stock-transfers/${row.id}`)}
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
