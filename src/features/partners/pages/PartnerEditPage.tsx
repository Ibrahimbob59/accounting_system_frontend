import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { PartnerForm } from '@/features/partners/components/PartnerForm'
import { usePartner } from '@/features/partners/hooks/usePartner'

export function PartnerEditPage() {
  const { t } = useTranslation('partners')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: partner, isLoading, isError } = usePartner(id)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        {t('edit.title')}
      </h1>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary-700" />
        </div>
      )}

      {isError && <p className="text-danger">{t('edit.notFound')}</p>}

      {partner && (
        <PartnerForm
          partner={partner}
          onSuccess={(updated) => navigate(`/app/partners/${updated.id}`)}
        />
      )}
    </div>
  )
}
