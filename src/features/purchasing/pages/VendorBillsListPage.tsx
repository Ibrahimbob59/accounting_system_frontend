import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SelectField } from '@/components/common/SelectField'
import { DataTable } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import { VendorBillStatusBadge } from '@/features/purchasing/components/VendorBillStatusBadge'
import { useVendorBills } from '@/features/purchasing/hooks/useVendorBills'
import {
  VENDOR_BILL_STATUSES,
  type ListVendorBillsQuery,
  type VendorBill,
  type VendorBillStatus,
} from '@/features/purchasing/types/purchasing.types'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'

const LIMIT = 20

export function VendorBillsListPage() {
  const { t, i18n } = useTranslation('purchasing')
  const navigate = useNavigate()
  const canCreate = usePermission('purchase.create')

  const [status, setStatus] = useState<'all' | VendorBillStatus>('all')
  const [page, setPage] = useState(1)

  const partners = useAllPartners()
  const lookupCurrency = useCurrencyLookup()

  const query: ListVendorBillsQuery = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      page,
      limit: LIMIT,
    }),
    [status, page]
  )

  const list = useVendorBills(query)
  const meta = list.data?.meta

  const supplierName = (id: string) =>
    partners.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  const columns: ColumnDef<VendorBill>[] = [
    {
      id: 'billNo',
      enableSorting: false,
      header: t('bill.columns.number'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">{row.original.billNo}</span>
      ),
    },
    {
      id: 'date',
      enableSorting: false,
      header: t('bill.columns.date'),
      cell: ({ row }) => formatDate(row.original.billDate, i18n.language),
    },
    {
      id: 'supplier',
      enableSorting: false,
      header: t('bill.columns.supplier'),
      cell: ({ row }) => (
        <span className="text-text-primary">
          {supplierName(row.original.supplierId)}
        </span>
      ),
    },
    {
      id: 'ref',
      enableSorting: false,
      header: t('bill.columns.supplierRef'),
      cell: ({ row }) => (
        <span className="text-text-muted">
          {row.original.supplierRef ?? '—'}
        </span>
      ),
    },
    {
      id: 'total',
      enableSorting: false,
      header: t('bill.columns.total'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">
          {formatMoney(
            row.original.grandTotal,
            lookupCurrency(row.original.currencyCode),
            i18n.language
          )}
        </span>
      ),
    },
    {
      id: 'status',
      enableSorting: false,
      header: t('bill.columns.status'),
      cell: ({ row }) => <VendorBillStatusBadge status={row.original.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {t('bill.list.title')}
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">
            {t('bill.list.subtitle')}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/app/vendor-bills/new')}>
            <Plus className="size-4" />
            {t('bill.list.new')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          className="w-[180px]"
          id="vb-f-status"
          label={t('filters.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'all' | VendorBillStatus)
            setPage(1)
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            ...VENDOR_BILL_STATUSES.map((s) => ({
              value: s,
              label: t(`bill.status.${s}`),
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
            emptyState={t('bill.list.empty')}
            onRowClick={(row) => navigate(`/app/vendor-bills/${row.id}`)}
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
