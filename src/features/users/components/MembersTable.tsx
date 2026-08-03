import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { PaginationMeta } from '@/types/api'
import type { User } from '@/features/users/types/users.types'

interface MembersTableProps {
  users: User[]
  meta: PaginationMeta | null | undefined
  onPageChange: (updater: (page: number) => number) => void
}

export function MembersTable({ users, meta, onPageChange }: MembersTableProps) {
  const { t, i18n } = useTranslation('users')
  const navigate = useNavigate()

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(i18n.language) : '—'

  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      enableSorting: false,
      header: t('list.columns.name'),
      cell: ({ row }) => (
        <span className="font-semibold text-text-primary">
          {`${row.original.firstName} ${row.original.lastName}`.trim()}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      enableSorting: false,
      header: t('list.columns.email'),
    },
    {
      id: 'roles',
      enableSorting: false,
      header: t('list.columns.roles'),
      // TODO(D-001): the API doesn't return roles yet (docs/DEFERRED.md).
      // Renders empty until it does, at which point this fills in on its own.
      // Deliberately NOT a "none"/"—" placeholder: absent means unknown, and
      // claiming a user has no roles would be worse than showing nothing.
      cell: ({ row }) => {
        const roles = row.original.roles
        if (!roles?.length) return null
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <StatusBadge key={role.id} variant="info">
                {role.name}
              </StatusBadge>
            ))}
          </div>
        )
      },
    },
    {
      id: 'lastLoginAt',
      enableSorting: false,
      header: t('list.columns.lastLogin'),
      cell: ({ row }) => formatDate(row.original.lastLoginAt),
    },
    {
      id: 'status',
      enableSorting: false,
      header: t('list.columns.status'),
      cell: ({ row }) =>
        row.original.isActive ? (
          <StatusBadge variant="success">{t('list.status.active')}</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">
            {t('list.status.inactive')}
          </StatusBadge>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={users}
        emptyState={t('list.empty')}
        onRowClick={(row) => navigate(`/app/users/${row.id}`)}
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
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
              {t('list.pagination.prev')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange((p) => p + 1)}
            >
              {t('list.pagination.next')}
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
