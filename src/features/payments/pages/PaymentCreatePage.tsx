import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { PaymentForm } from '@/features/payments/components/PaymentForm'
import { useCreatePayment } from '@/features/payments/hooks/usePaymentMutations'
import { paymentsErrorMessage } from '@/features/payments/lib/payments-errors'
import { toast } from '@/lib/swal'

export function PaymentCreatePage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const createPayment = useCreatePayment()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/payments"
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

      <PaymentForm
        isPending={createPayment.isPending}
        banner={banner}
        submitLabel={t('create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createPayment.mutate(dto, {
            onSuccess: (payment) => {
              toast('success', t('create.created'))
              navigate(`/app/payments/${payment.id}`)
            },
            onError: (err) => setBanner(paymentsErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
