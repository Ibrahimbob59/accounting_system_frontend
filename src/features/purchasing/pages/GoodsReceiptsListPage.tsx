import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2 } from 'lucide-react'

import { DataTable } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import { useGoodsReceipts } from '@/features/purchasing/hooks/useGoodsReceipts'
import type {
  GoodsReceipt,
  ListGoodsReceiptsQuery,
} from '@/features/purchasing/types/purchasing.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { formatDate } from '@/lib/format'

const LIMIT = 20

export function GoodsReceiptsListPage() {
  const { t, i18n } = useTranslation('purchasing')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const query: ListGoodsReceiptsQuery = useMemo(
    () => ({ page, limit: LIMIT }),
    [page]
  )
  const list = useGoodsReceipts(query)
  const meta = list.data?.meta

  const columns: ColumnDef<GoodsReceipt>[] = [
    {
      id: 'receiptNo',
      enableSorting: false,
      header: t('receipt.columns.number'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">{row.original.receiptNo}</span>
      ),
    },
    {
      id: 'date',
      enableSorting: false,
      header: t('receipt.columns.date'),
      cell: ({ row }) => formatDate(row.original.receiptDate, i18n.language),
    },
    {
      id: 'lines',
      enableSorting: false,
      header: t('receipt.columns.lines'),
      cell: ({ row }) => row.original.lines.length,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('receipt.list.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('receipt.list.subtitle')}
        </p>
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
            emptyState={t('receipt.list.empty')}
            onRowClick={(row) => navigate(`/app/goods-receipts/${row.id}`)}
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
