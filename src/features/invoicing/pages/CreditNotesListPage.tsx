import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SelectField } from '@/components/common/SelectField'
import { DataTable } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import { InvoiceStatusBadge } from '@/features/invoicing/components/InvoiceStatusBadge'
import { useCreditNotes } from '@/features/invoicing/hooks/useCreditNotes'
import {
  CREDIT_NOTE_STATUSES,
  type CreditNote,
  type CreditNoteStatus,
  type ListCreditNotesQuery,
} from '@/features/invoicing/types/credit-notes.types'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'

const LIMIT = 20

export function CreditNotesListPage() {
  const { t, i18n } = useTranslation('invoicing')
  const navigate = useNavigate()
  const canCreate = usePermission('sales.create')

  const [status, setStatus] = useState<'all' | CreditNoteStatus>('all')
  const [page, setPage] = useState(1)

  const partners = useAllPartners()
  const lookupCurrency = useCurrencyLookup()

  const query: ListCreditNotesQuery = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      page,
      limit: LIMIT,
    }),
    [status, page]
  )

  const list = useCreditNotes(query)
  const meta = list.data?.meta

  const customerName = (id: string) =>
    partners.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  const columns: ColumnDef<CreditNote>[] = [
    {
      id: 'creditNoteNo',
      enableSorting: false,
      header: t('columns.number'),
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">
          {row.original.creditNoteNo}
        </span>
      ),
    },
    {
      id: 'date',
      enableSorting: false,
      header: t('columns.date'),
      cell: ({ row }) => formatDate(row.original.creditNoteDate, i18n.language),
    },
    {
      id: 'customer',
      enableSorting: false,
      header: t('columns.customer'),
      cell: ({ row }) => (
        <span className="text-text-primary">
          {customerName(row.original.customerId)}
        </span>
      ),
    },
    {
      id: 'total',
      enableSorting: false,
      header: t('columns.total'),
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
      header: t('columns.status'),
      cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {t('credit.title')}
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">
            {t('credit.subtitle')}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/app/credit-notes/new')}>
            <Plus className="size-4" />
            {t('credit.newCreditNote')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          className="w-[160px]"
          id="cn-status"
          label={t('filters.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'all' | CreditNoteStatus)
            setPage(1)
          }}
          options={[
            { value: 'all', label: t('filters.all') },
            ...CREDIT_NOTE_STATUSES.map((s) => ({
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
            emptyState={t('credit.empty')}
            onRowClick={(row) => navigate(`/app/credit-notes/${row.id}`)}
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
