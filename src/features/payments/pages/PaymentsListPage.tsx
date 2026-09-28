import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SelectField } from '@/components/common/SelectField'
import { DataTable } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import { PaymentStatusBadge } from '@/features/payments/components/PaymentStatusBadge'
import { usePayments } from '@/features/payments/hooks/usePayments'
import {
  PAYMENT_DIRECTIONS,
  PAYMENT_STATUSES,
  type ListPaymentsQuery,
  type Payment,
  type PaymentDirection,
  type PaymentStatus,
} from '@/features/payments/types/payments.types'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'

const LIMIT = 20

export function PaymentsListPage() {
  const { t, i18n } = useTranslation('payments')
  const navigate = useNavigate()
  const canCreate = usePermission('payment.create')

  const [direction, setDirection] = useState<'all' | PaymentDirection>('all')
  const [status, setStatus] = useState<'all' | PaymentStatus>('all')
  const [page, setPage] = useState(1)

  const partners = useAllPartners()
  const lookupCurrency = useCurrencyLookup()

  const query: ListPaymentsQuery = useMemo(
    () => ({
      direction: direction === 'all' ? undefined : direction,
      status: status === 'all' ? undefined : status,
      page,
      limit: LIMIT,
    }),
    [direction, status, page]
  )

  const list = usePayments(query)
  const meta = list.data?.meta

  const partnerName = (id: string) =>
    partners.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  const columns: ColumnDef<Payment>[] = [
    {
      id: 'paymentNo',
      enableSorting: false,
      header: t('columns.number'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">{row.original.paymentNo}</span>
      ),
    },
    {
      id: 'date',
      enableSorting: false,
      header: t('columns.date'),
      cell: ({ row }) => formatDate(row.original.paymentDate, i18n.language),
    },
    {
      id: 'direction',
      enableSorting: false,
      header: t('columns.direction'),
      cell: ({ row }) => t(`direction.${row.original.direction}`),
    },
    {
      id: 'partner',
      enableSorting: false,
      header: t('columns.partner'),
      cell: ({ row }) => (
        <span className="text-text-primary">
          {partnerName(row.original.partnerId)}
        </span>
      ),
    },
    {
      id: 'method',
      enableSorting: false,
      header: t('columns.method'),
      cell: ({ row }) => t(`method.${row.original.method}`),
    },
    {
      id: 'amount',
      enableSorting: false,
      header: t('columns.amount'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">
          {formatMoney(
            row.original.amountOriginal,
            lookupCurrency(row.original.currencyCode),
            i18n.language
          )}
        </span>
      ),
    },
    {
      id: 'status',
      enableSorting: false,
      header: t('columns.status'),
      cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {t('list.title')}
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">
            {t('list.subtitle')}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/app/payments/new')}>
            <Plus className="size-4" />
            {t('list.newPayment')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          className="w-[180px]"
          id="pay-f-direction"
          label={t('filters.direction')}
          value={direction}
          onChange={(e) => {
            setDirection(e.target.value as 'all' | PaymentDirection)
            setPage(1)
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            ...PAYMENT_DIRECTIONS.map((d) => ({
              value: d,
              label: t(`direction.${d}`),
            })),
          ]}
        />
        <SelectField
          className="w-[160px]"
          id="pay-f-status"
          label={t('filters.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'all' | PaymentStatus)
            setPage(1)
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            ...PAYMENT_STATUSES.map((s) => ({
              value: s,
              label: t(`status.${s}`),
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
            emptyState={t('list.empty')}
            onRowClick={(row) => navigate(`/app/payments/${row.id}`)}
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
