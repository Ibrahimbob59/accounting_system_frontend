import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { StockCountForm } from '@/features/stock/components/StockCountForm'
import { useCreateStockCount } from '@/features/stock/hooks/useStockCounts'
import { stockOpsErrorMessage } from '@/features/stock/lib/stock-ops-errors'
import { toast } from '@/lib/swal'

export function StockCountCreatePage() {
  const { t } = useTranslation('stockOps')
  const navigate = useNavigate()
  const createCount = useCreateStockCount()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/stock-counts"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('count.detail.back')}
      </Link>

      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('count.create.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('count.create.subtitle')}
        </p>
      </div>

      <StockCountForm
        isPending={createCount.isPending}
        banner={banner}
        submitLabel={t('count.create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createCount.mutate(dto, {
            onSuccess: (count) => {
              toast('success', t('count.create.created'))
              navigate(`/app/stock-counts/${count.id}`)
            },
            onError: (err) => setBanner(stockOpsErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
