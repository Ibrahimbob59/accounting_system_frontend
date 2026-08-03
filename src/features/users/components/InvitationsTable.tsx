import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, MailX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useInvitations } from '@/features/invitations/hooks/useInvitations'
import { useRevokeInvitation } from '@/features/invitations/hooks/useRevokeInvitation'
import { useRoles } from '@/features/users/hooks/useRoles'
import { isPermissionDenied, usePermission } from '@/features/auth/lib/permissions'
import type { Invitation } from '@/features/users/types/users.types'
import { confirm, toast } from '@/lib/swal'

/**
 * Pending invitations, with revoke.
 *
 * Unlike the members table, this one CAN show roles: `InvitationResponseDto`
 * returns `roleIds` (docs/DEFERRED.md → D-001 covers only users). They're
 * resolved to names against `GET /roles` rather than displaying raw UUIDs.
 */
export function InvitationsTable() {
  const { t, i18n } = useTranslation('users')
  const { data: invitations, isLoading, isError, error } = useInvitations()
  const { data: roles } = useRoles()
  const revoke = useRevokeInvitation()
  const canRevoke = usePermission('user.delete')

  const roleName = (id: string) =>
    roles?.find((r) => r.id === id)?.name ?? id

  const handleRevoke = async (invitation: Invitation) => {
    const confirmed = await confirm({
      title: t('invitations.revokeConfirm.title'),
      description: t('invitations.revokeConfirm.body', {
        email: invitation.email,
      }),
      confirmLabel: t('invitations.revokeConfirm.confirm'),
      cancelLabel: t('invitations.revokeConfirm.cancel'),
      variant: 'danger',
    })
    if (!confirmed) return
    revoke.mutate(invitation.id, {
      onSuccess: () => toast('success', t('invitations.revoked')),
      onError: (err) =>
        toast(
          'error',
          isPermissionDenied(err)
            ? t('errors.permissionDenied')
            : t('errors.generic')
        ),
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  // Only pending ones are actionable; accepted invitations are just history,
  // and the member they created already shows on the Members tab.
  const pending = (invitations ?? []).filter((i) => !i.accepted)

  if (!pending.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <MailX className="size-8 text-text-muted" />
        <div>
          <p className="font-medium text-text-primary">
            {t('invitations.empty.title')}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {t('invitations.empty.body')}
          </p>
        </div>
      </div>
    )
  }

  const columns: ColumnDef<Invitation>[] = [
    {
      accessorKey: 'email',
      enableSorting: false,
      header: t('invitations.columns.email'),
      cell: ({ row }) => (
        <span className="font-semibold text-text-primary">
          {row.original.email}
        </span>
      ),
    },
    {
      id: 'name',
      enableSorting: false,
      header: t('invitations.columns.name'),
      cell: ({ row }) =>
        `${row.original.firstName ?? ''} ${row.original.lastName ?? ''}`.trim() ||
        '—',
    },
    {
      id: 'roles',
      enableSorting: false,
      header: t('invitations.columns.roles'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roleIds.map((id) => (
            <StatusBadge key={id} variant="info">
              {roleName(id)}
            </StatusBadge>
          ))}
        </div>
      ),
    },
    {
      id: 'expiresAt',
      enableSorting: false,
      header: t('invitations.columns.expires'),
      cell: ({ row }) => {
        const expiresAt = new Date(row.original.expiresAt)
        const expired = expiresAt.getTime() < Date.now()
        return (
          <span className={expired ? 'text-danger' : undefined}>
            {expired
              ? t('invitations.expired')
              : expiresAt.toLocaleDateString(i18n.language)}
          </span>
        )
      },
    },
    {
      id: 'actions',
      enableSorting: false,
      header: '',
      cell: ({ row }) =>
        canRevoke ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={revoke.isPending}
            onClick={() => void handleRevoke(row.original)}
          >
            {t('invitations.revoke')}
          </Button>
        ) : null,
    },
  ]

  return <DataTable columns={columns} data={pending} />
}
