import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { PurchaseOrderForm } from '@/features/purchasing/components/PurchaseOrderForm'
import {
  usePurchaseOrder,
  useUpdatePurchaseOrder,
} from '@/features/purchasing/hooks/usePurchaseOrders'
import { purchasingErrorMessage } from '@/features/purchasing/lib/purchasing-errors'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { toast } from '@/lib/swal'

export function PurchaseOrderEditPage() {
  const { t } = useTranslation('purchasing')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: po, isLoading, isError, error } = usePurchaseOrder(id)
  const updatePO = useUpdatePurchaseOrder()
  const [banner, setBanner] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }
  if (isError || !po) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to={`/app/purchase-orders/${po.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('po.detail.back')}
      </Link>

      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        {t('po.edit.title', { number: po.orderNo })}
      </h1>

      <PurchaseOrderForm
        initial={po}
        isPending={updatePO.isPending}
        banner={banner}
        submitLabel={t('po.edit.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          updatePO.mutate(
            { id: po.id, dto },
            {
              onSuccess: () => {
                toast('success', t('po.edit.saved'))
                navigate(`/app/purchase-orders/${po.id}`)
              },
              onError: (err) => setBanner(purchasingErrorMessage(err, t)),
            }
          )
        }}
      />
    </div>
  )
}
