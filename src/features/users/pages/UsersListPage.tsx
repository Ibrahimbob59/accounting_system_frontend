import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MembersTable } from '@/features/users/components/MembersTable'
import { InvitationsTable } from '@/features/users/components/InvitationsTable'
import { InviteUserDialog } from '@/features/users/components/InviteUserDialog'
import { useUsers } from '@/features/users/hooks/useUsers'
import { isPermissionDenied, usePermission } from '@/features/auth/lib/permissions'

const LIMIT = 20

/**
 * Team management: company members and pending invitations.
 *
 * `GET /users` exposes no search or filter params, so — unlike the partners
 * list — there's no filter row. Adding client-side filtering over one page of
 * results would silently only search the current page, which is worse than not
 * offering it.
 */
export function UsersListPage() {
  const { t } = useTranslation('users')
  const [page, setPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)
  const canInvite = usePermission('user.create')

  const { data, isLoading, isError, error } = useUsers({ page, limit: LIMIT })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {t('list.title')}
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">{t('list.subtitle')}</p>
        </div>
        {canInvite && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            {t('list.invite')}
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 border-b border-border p-0"
        >
          <TabsTrigger value="members" className="flex-none px-1 py-2.5">
            {t('tabs.members')}
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex-none px-1 py-2.5">
            {t('tabs.invitations')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-brand" />
            </div>
          ) : isError ? (
            // A 403 here means the role genuinely can't read users — say that,
            // rather than rendering an empty table that reads as "no users".
            <p className="py-8 text-center text-text-muted">
              {isPermissionDenied(error)
                ? t('errors.permissionDeniedSection')
                : t('errors.generic')}
            </p>
          ) : (
            <MembersTable
              users={data?.data ?? []}
              meta={data?.meta}
              onPageChange={setPage}
            />
          )}
        </TabsContent>

        <TabsContent value="invitations" className="pt-6">
          <InvitationsTable />
        </TabsContent>
      </Tabs>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
