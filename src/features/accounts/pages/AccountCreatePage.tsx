import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { AccountForm } from '@/features/accounts/components/AccountForm'
import { useCreateAccount } from '@/features/accounts/hooks/useCreateAccount'
import { accountErrorMessage } from '@/features/accounts/lib/account-errors'
import { toast } from '@/lib/swal'

export function AccountCreatePage() {
  const { t } = useTranslation('accounts')
  const navigate = useNavigate()
  const createAccount = useCreateAccount()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/app/accounts"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        {t('create.title')}
      </h1>

      <AccountForm
        isPending={createAccount.isPending}
        banner={banner}
        submitLabel={t('create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createAccount.mutate(dto, {
            onSuccess: (account) => {
              toast('success', t('create.created'))
              navigate(`/app/accounts/${account.id}`)
            },
            onError: (err) => setBanner(accountErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
