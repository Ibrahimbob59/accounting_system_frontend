import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { CompanyForm } from '@/features/companies/components/CompanyForm'
import { useCreateCompany } from '@/features/companies/hooks/useCreateCompany'
import { companyErrorMessage } from '@/features/companies/lib/company-errors'
import { toast } from '@/lib/swal'

/**
 * Creating a company also makes the caller its owner and Company Admin, and
 * seeds its chart of accounts, default VAT rate and document sequences —
 * all server-side. Until this screen existed there was no way to do any of
 * that from the UI.
 */
export function CompanyCreatePage() {
  const { t } = useTranslation('companies')
  const navigate = useNavigate()
  const createCompany = useCreateCompany()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/app/companies"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('create.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('create.subtitle')}
        </p>
      </div>

      <CompanyForm
        isPending={createCompany.isPending}
        banner={banner}
        submitLabel={t('create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createCompany.mutate(dto, {
            onSuccess: (company) => {
              // Deliberately NOT switching into the new company: that would
              // change the active tenant out from under whatever the user was
              // doing. They can switch from the detail page when ready.
              toast('success', t('create.created', { name: company.name }))
              navigate(`/app/companies/${company.id}`)
            },
            onError: (err) => setBanner(companyErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
