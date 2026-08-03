import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { AccountForm } from '@/features/accounts/components/AccountForm'
import { accountErrorMessage } from '@/features/accounts/lib/account-errors'
import { useAccount } from '@/features/accounts/hooks/useAccount'
import { useUpdateAccount } from '@/features/accounts/hooks/useUpdateAccount'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { toast } from '@/lib/swal'

export function AccountEditPage() {
  const { t } = useTranslation('accounts')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: account, isLoading, isError, error } = useAccount(id)
  const updateAccount = useUpdateAccount()
  const [banner, setBanner] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !account) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to={`/app/accounts/${account.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('edit.back')}
      </Link>

      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        {t('edit.title', { number: account.number })}
      </h1>

      <AccountForm
        account={account}
        isPending={updateAccount.isPending}
        banner={banner}
        submitLabel={t('edit.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          updateAccount.mutate(
            { id: account.id, dto },
            {
              onSuccess: () => {
                toast('success', t('edit.saved'))
                navigate(`/app/accounts/${account.id}`)
              },
              onError: (err) => setBanner(accountErrorMessage(err, t)),
            }
          )
        }}
      />
    </div>
  )
}
