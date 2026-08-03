import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { CompanyForm } from '@/features/companies/components/CompanyForm'
import { useCompany } from '@/features/companies/hooks/useCompany'
import { useUpdateCompany } from '@/features/companies/hooks/useUpdateCompany'
import { companyErrorMessage } from '@/features/companies/lib/company-errors'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { toast } from '@/lib/swal'

export function CompanyEditPage() {
  const { t } = useTranslation('companies')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: company, isLoading, isError, error } = useCompany(id)
  const updateCompany = useUpdateCompany()
  const [banner, setBanner] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !company) {
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
        to={`/app/companies/${company.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('edit.back')}
      </Link>

      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        {t('edit.title', { name: company.name })}
      </h1>

      <CompanyForm
        company={company}
        isPending={updateCompany.isPending}
        banner={banner}
        submitLabel={t('edit.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          updateCompany.mutate(
            { id: company.id, dto },
            {
              onSuccess: () => {
                toast('success', t('edit.saved'))
                navigate(`/app/companies/${company.id}`)
              },
              onError: (err) => setBanner(companyErrorMessage(err, t)),
            }
          )
        }}
      />
    </div>
  )
}
