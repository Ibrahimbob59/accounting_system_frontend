import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { PartnerForm } from '@/features/partners/components/PartnerForm'

export function PartnerCreatePage() {
  const { t } = useTranslation('partners')
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        {t('create.title')}
      </h1>
      <PartnerForm onSuccess={(partner) => navigate(`/app/partners/${partner.id}`)} />
    </div>
  )
}
