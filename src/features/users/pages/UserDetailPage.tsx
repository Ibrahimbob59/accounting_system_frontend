import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useUser } from '@/features/users/hooks/useUser'
import { useUpdateUser } from '@/features/users/hooks/useUpdateUser'
import { useRemoveUser } from '@/features/users/hooks/useRemoveUser'
import { isPermissionDenied, usePermission } from '@/features/auth/lib/permissions'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { makeUserEditSchema } from '@/features/users/types/users.types'
import type { UserEditFormValues } from '@/features/users/types/users.types'
import { confirm, toast } from '@/lib/swal'

/**
 * A single member: editable profile, activate/deactivate, and remove from
 * company.
 *
 * There is deliberately no role editor here — roles can't be read back from
 * the API, and `PATCH /users/:id { roleIds }` only ever ADDS roles with no way
 * to remove one, so any editor would be a one-way door. See docs/DEFERRED.md
 * → D-002.
 */
export function UserDetailPage() {
  const { t } = useTranslation('users')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: user, isLoading, isError, error } = useUser(id)
  const updateUser = useUpdateUser()
  const removeUser = useRemoveUser()
  const canUpdate = usePermission('user.update')
  const canDelete = usePermission('user.delete')
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [banner, setBanner] = useState<string | null>(null)

  const schema = useMemo(() => makeUserEditSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserEditFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      preferredLanguage: 'EN',
    },
  })

  // The form is rendered before the query resolves, so seed it once the user
  // arrives rather than gating the whole page on it.
  useEffect(() => {
    if (!user) return
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      preferredLanguage: user.preferredLanguage,
    })
  }, [user, reset])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  const isSelf = user.id === currentUserId

  const onSubmit = (values: UserEditFormValues) => {
    setBanner(null)
    updateUser.mutate(
      {
        id: user.id,
        dto: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || undefined,
          preferredLanguage: values.preferredLanguage,
        },
      },
      {
        onSuccess: () => toast('success', t('detail.saved')),
        onError: (err) =>
          setBanner(
            isPermissionDenied(err)
              ? t('errors.permissionDenied')
              : t('errors.generic')
          ),
      }
    )
  }

  const handleToggleActive = () => {
    updateUser.mutate(
      { id: user.id, dto: { isActive: !user.isActive } },
      {
        onSuccess: () =>
          toast(
            'success',
            user.isActive ? t('detail.deactivated') : t('detail.activated')
          ),
        onError: (err) =>
          toast(
            'error',
            isPermissionDenied(err)
              ? t('errors.permissionDenied')
              : t('errors.generic')
          ),
      }
    )
  }

  const handleRemove = async () => {
    const confirmed = await confirm({
      title: t('detail.removeConfirm.title'),
      // Wording matters here: the backend removes company membership, it does
      // not delete the account. "Delete user" would misrepresent what happens.
      description: t('detail.removeConfirm.body', {
        name: `${user.firstName} ${user.lastName}`.trim(),
      }),
      confirmLabel: t('detail.removeConfirm.confirm'),
      cancelLabel: t('detail.removeConfirm.cancel'),
      variant: 'danger',
    })
    if (!confirmed) return
    removeUser.mutate(user.id, {
      onSuccess: () => {
        toast('success', t('detail.removed'))
        navigate('/app/users')
      },
      onError: (err) =>
        toast(
          'error',
          isPermissionDenied(err)
            ? t('errors.permissionDenied')
            : t('errors.generic')
        ),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/users"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {`${user.firstName} ${user.lastName}`.trim()}
          </h1>
          {user.isActive ? (
            <StatusBadge variant="success">{t('list.status.active')}</StatusBadge>
          ) : (
            <StatusBadge variant="neutral">
              {t('list.status.inactive')}
            </StatusBadge>
          )}
        </div>

        {/* Acting on yourself here would lock you out of your own company, so
            both destructive actions are withheld for the current user. */}
        {!isSelf && (
          <div className="flex flex-wrap gap-2">
            {canUpdate && (
              <Button
                variant="outline"
                onClick={handleToggleActive}
                disabled={updateUser.isPending}
              >
                {user.isActive
                  ? t('detail.actions.deactivate')
                  : t('detail.actions.activate')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => void handleRemove()}
                disabled={removeUser.isPending}
              >
                {t('detail.actions.remove')}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <InfoRow label={t('detail.fields.email')} value={user.email} />
        <InfoRow
          label={t('detail.fields.lastLogin')}
          value={
            user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleString()
              : t('detail.never')
          }
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('detail.profile')}
        </h2>

        {banner && <FormBanner variant="error">{banner}</FormBanner>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="user-firstName"
            label={t('detail.fields.firstName')}
            disabled={!canUpdate}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <TextField
            id="user-lastName"
            label={t('detail.fields.lastName')}
            disabled={!canUpdate}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="user-email"
            type="email"
            label={t('detail.fields.email')}
            disabled={!canUpdate}
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            id="user-phone"
            type="tel"
            label={t('detail.fields.phone')}
            disabled={!canUpdate}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <SelectField
          id="user-language"
          label={t('detail.fields.language')}
          disabled={!canUpdate}
          options={[
            { value: 'EN', label: 'English' },
            { value: 'FR', label: 'Français' },
            { value: 'AR', label: 'العربية' },
          ]}
          error={errors.preferredLanguage?.message}
          {...register('preferredLanguage')}
        />

        {canUpdate && (
          <Button type="submit" disabled={!isDirty || updateUser.isPending}>
            {updateUser.isPending && <Loader2 className="animate-spin" />}
            {t('detail.save')}
          </Button>
        )}
      </form>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-text-primary">{value}</dd>
    </div>
  )
}
