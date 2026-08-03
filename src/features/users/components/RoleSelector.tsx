import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useRoles } from '@/features/users/hooks/useRoles'

interface RoleSelectorProps {
  value: string[]
  onChange: (roleIds: string[]) => void
  error?: string
  disabled?: boolean
}

/**
 * Multi-select over the company's roles.
 *
 * Used only by the invite dialog: roles are assigned once, at invitation, and
 * can't be changed afterwards (docs/DEFERRED.md → D-002). That makes this the
 * user's only chance to get it right, which is why each role shows its
 * description and permission count rather than just a name — picking blind
 * from "Company Admin / Company Member" isn't an informed choice.
 */
export function RoleSelector({
  value,
  onChange,
  error,
  disabled,
}: RoleSelectorProps) {
  const { t } = useTranslation('users')
  const { data: roles, isLoading, isError } = useRoles()

  const toggle = (roleId: string) => {
    onChange(
      value.includes(roleId)
        ? value.filter((id) => id !== roleId)
        : [...value, roleId]
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="size-5 animate-spin text-brand" />
      </div>
    )
  }

  // Without roles there's nothing valid to submit, so say so plainly instead
  // of rendering an empty box that looks like a loading state that never ends.
  if (isError || !roles?.length) {
    return <p className="text-[13px] text-danger">{t('roles.loadFailed')}</p>
  }

  return (
    <div className="space-y-2">
      <span className="field-label">{t('invite.roles')}</span>
      <div
        className="space-y-2 rounded-md border border-border p-3"
        role="group"
        aria-label={t('invite.roles')}
        aria-invalid={error ? true : undefined}
      >
        {roles.map((role) => (
          <div key={role.id} className="flex items-start gap-2.5">
            <Checkbox
              id={`role-${role.id}`}
              checked={value.includes(role.id)}
              onCheckedChange={() => toggle(role.id)}
              disabled={disabled}
              className="mt-0.5"
            />
            <Label htmlFor={`role-${role.id}`} className="cursor-pointer">
              <span className="block text-sm font-medium text-text-primary">
                {role.name}
              </span>
              <span className="block text-[13px] font-normal text-text-muted">
                {role.description ??
                  t('roles.permissionCount', {
                    count: role.permissions.length,
                  })}
              </span>
            </Label>
          </div>
        ))}
      </div>
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </div>
  )
}
