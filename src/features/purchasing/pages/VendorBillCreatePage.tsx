import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { VendorBillForm } from '@/features/purchasing/components/VendorBillForm'
import { useCreateVendorBill } from '@/features/purchasing/hooks/useVendorBills'
import { usePurchaseOrder } from '@/features/purchasing/hooks/usePurchaseOrders'
import { purchasingErrorMessage } from '@/features/purchasing/lib/purchasing-errors'
import { toast } from '@/lib/swal'

export function VendorBillCreatePage() {
  const { t } = useTranslation('purchasing')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const poId = searchParams.get('poId') ?? undefined

  const createBill = useCreateVendorBill()
  const fromPO = usePurchaseOrder(poId)
  const [banner, setBanner] = useState<string | null>(null)

  // Wait for the PO to load before rendering the form so its lines prefill.
  if (poId && fromPO.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/vendor-bills"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('bill.detail.back')}
      </Link>

      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('bill.create.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('bill.create.subtitle')}
        </p>
      </div>

      <VendorBillForm
        fromPO={poId ? fromPO.data : undefined}
        isPending={createBill.isPending}
        banner={banner}
        submitLabel={t('bill.create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createBill.mutate(dto, {
            onSuccess: (bill) => {
              toast('success', t('bill.create.created'))
              navigate(`/app/vendor-bills/${bill.id}`)
            },
            onError: (err) => setBanner(purchasingErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
