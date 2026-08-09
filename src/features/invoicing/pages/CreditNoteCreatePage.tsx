import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { CreditNoteForm } from '@/features/invoicing/components/CreditNoteForm'
import { useCreateCreditNote } from '@/features/invoicing/hooks/useCreditNotes'
import { invoicingErrorMessage } from '@/features/invoicing/lib/invoicing-errors'
import { toast } from '@/lib/swal'

export function CreditNoteCreatePage() {
  const { t } = useTranslation('invoicing')
  const navigate = useNavigate()
  const createCreditNote = useCreateCreditNote()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/credit-notes"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('credit.back')}
      </Link>

      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('credit.create.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('credit.create.subtitle')}
        </p>
      </div>

      <CreditNoteForm
        isPending={createCreditNote.isPending}
        banner={banner}
        submitLabel={t('credit.create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createCreditNote.mutate(dto, {
            onSuccess: (cn) => {
              toast('success', t('credit.create.created'))
              navigate(`/app/credit-notes/${cn.id}`)
            },
            onError: (err) => setBanner(invoicingErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
