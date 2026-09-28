import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { PurchaseOrderForm } from '@/features/purchasing/components/PurchaseOrderForm'
import { useCreatePurchaseOrder } from '@/features/purchasing/hooks/usePurchaseOrders'
import { purchasingErrorMessage } from '@/features/purchasing/lib/purchasing-errors'
import { toast } from '@/lib/swal'

export function PurchaseOrderCreatePage() {
  const { t } = useTranslation('purchasing')
  const navigate = useNavigate()
  const createPO = useCreatePurchaseOrder()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/purchase-orders"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('po.detail.back')}
      </Link>

      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('po.create.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('po.create.subtitle')}
        </p>
      </div>

      <PurchaseOrderForm
        isPending={createPO.isPending}
        banner={banner}
        submitLabel={t('po.create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createPO.mutate(dto, {
            onSuccess: (po) => {
              toast('success', t('po.create.created'))
              navigate(`/app/purchase-orders/${po.id}`)
            },
            onError: (err) => setBanner(purchasingErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
