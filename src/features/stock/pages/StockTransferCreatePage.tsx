import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { StockTransferForm } from '@/features/stock/components/StockTransferForm'
import { useCreateStockTransfer } from '@/features/stock/hooks/useStockTransfers'
import { stockOpsErrorMessage } from '@/features/stock/lib/stock-ops-errors'
import { toast } from '@/lib/swal'

export function StockTransferCreatePage() {
  const { t } = useTranslation('stockOps')
  const navigate = useNavigate()
  const createTransfer = useCreateStockTransfer()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/stock-transfers"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('transfer.detail.back')}
      </Link>

      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('transfer.create.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('transfer.create.subtitle')}
        </p>
      </div>

      <StockTransferForm
        isPending={createTransfer.isPending}
        banner={banner}
        submitLabel={t('transfer.create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createTransfer.mutate(dto, {
            onSuccess: (transfer) => {
              toast('success', t('transfer.create.created'))
              navigate(`/app/stock-transfers/${transfer.id}`)
            },
            onError: (err) => setBanner(stockOpsErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
