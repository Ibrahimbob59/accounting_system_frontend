import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/common/Modal'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { RoleSelector } from '@/features/users/components/RoleSelector'
import { useCreateInvitation } from '@/features/invitations/hooks/useCreateInvitation'
import { useInvitationDurations } from '@/features/invitations/hooks/useInvitationDurations'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { makeInviteSchema } from '@/features/users/types/users.types'
import type {
  InvitationDuration,
  InviteFormValues,
} from '@/features/users/types/users.types'
import { toast } from '@/lib/swal'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Invite dialog — the only supported way to add a user to a company.
 *
 * `POST /users` exists but takes a plaintext password, i.e. an admin choosing
 * someone else's credentials; the invitation flow exists so that never
 * happens, so it isn't offered here.
 *
 * Roles are required and non-empty on purpose: this is the ONLY point at which
 * a user's roles can be set (docs/DEFERRED.md → D-002), so letting an invite
 * through with none would strand that user with no way to fix it from the UI.
 */
export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const { t } = useTranslation('users')
  const createInvitation = useCreateInvitation()
  const durations = useInvitationDurations()
  const [banner, setBanner] = useState<string | null>(null)

  const schema = useMemo(() => makeInviteSchema(t), [t])
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      roleIds: [],
      duration: '',
    },
  })

  // Reset on close so reopening never shows the previous invite's values or a
  // stale error banner. Done in the close handler rather than an effect on
  // `open`: closing is the actual event, and every close path (button, Esc,
  // overlay click, successful submit) funnels through here.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset()
      setBanner(null)
    }
    onOpenChange(next)
  }

  const durationOptions =
    durations.data?.map((d) => ({
      value: d.value,
      label: t('invite.durationOption', { label: d.label, count: d.days }),
    })) ?? []

  const onSubmit = (values: InviteFormValues) => {
    setBanner(null)
    createInvitation.mutate(
      {
        email: values.email.trim(),
        firstName: values.firstName?.trim() || undefined,
        lastName: values.lastName?.trim() || undefined,
        roleIds: values.roleIds,
        duration: values.duration as InvitationDuration,
      },
      {
        onSuccess: (invitation) => {
          toast('success', t('invite.sent', { email: invitation.email }))
          handleOpenChange(false)
        },
        onError: (err) => {
          // A denied invite is a permissions problem, not a broken form —
          // saying so is the difference between "ask an admin" and "try again".
          setBanner(
            isPermissionDenied(err)
              ? t('errors.permissionDenied')
              : t('errors.generic')
          )
        },
      }
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={t('invite.title')}
      description={t('invite.description')}
    >
      <form
        id="invite-user-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        {banner && <FormBanner variant="error">{banner}</FormBanner>}

        <TextField
          id="invite-email"
          type="email"
          label={t('invite.email')}
          placeholder={t('invite.emailPlaceholder')}
          autoComplete="off"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="invite-firstName"
            label={t('invite.firstName')}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <TextField
            id="invite-lastName"
            label={t('invite.lastName')}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        {/* RoleSelector is not a native input, so it goes through Controller
            rather than register() — same reasoning as CheckboxField. */}
        <Controller
          control={control}
          name="roleIds"
          render={({ field }) => (
            <RoleSelector
              value={field.value}
              onChange={field.onChange}
              error={errors.roleIds?.message}
              disabled={createInvitation.isPending}
            />
          )}
        />

        <SelectField
          id="invite-duration"
          label={t('invite.duration')}
          placeholder={t('invite.durationPlaceholder')}
          options={durationOptions}
          error={errors.duration?.message}
          {...register('duration')}
        />
      </form>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(false)}
          disabled={createInvitation.isPending}
        >
          {t('invite.cancel')}
        </Button>
        <Button
          type="submit"
          form="invite-user-form"
          disabled={createInvitation.isPending}
        >
          {createInvitation.isPending && <Loader2 className="animate-spin" />}
          {t('invite.submit')}
        </Button>
      </div>
    </Modal>
  )
}
