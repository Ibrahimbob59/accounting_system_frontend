import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { SalesInvoiceForm } from '@/features/invoicing/components/SalesInvoiceForm'
import { useCreateSalesInvoice } from '@/features/invoicing/hooks/useSalesInvoiceMutations'
import { invoicingErrorMessage } from '@/features/invoicing/lib/invoicing-errors'
import { toast } from '@/lib/swal'

export function SalesInvoiceCreatePage() {
  const { t } = useTranslation('invoicing')
  const navigate = useNavigate()
  const createInvoice = useCreateSalesInvoice()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/sales-invoices"
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

      <SalesInvoiceForm
        isPending={createInvoice.isPending}
        banner={banner}
        submitLabel={t('create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createInvoice.mutate(dto, {
            onSuccess: (invoice) => {
              toast('success', t('create.created'))
              navigate(`/app/sales-invoices/${invoice.id}`)
            },
            onError: (err) => setBanner(invoicingErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
