import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { JournalEntryForm } from '@/features/journal-entries/components/JournalEntryForm'
import { useCreateJournalEntry } from '@/features/journal-entries/hooks/useJournalEntryMutations'
import { journalEntryErrorMessage } from '@/features/journal-entries/lib/journal-entry-errors'
import { toast } from '@/lib/swal'

export function JournalEntryCreatePage() {
  const { t } = useTranslation('journalEntries')
  const navigate = useNavigate()
  const createEntry = useCreateJournalEntry()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/app/journal-entries"
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

      <JournalEntryForm
        isPending={createEntry.isPending}
        banner={banner}
        submitLabel={t('create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createEntry.mutate(dto, {
            onSuccess: (entry) => {
              toast('success', t('create.created'))
              navigate(`/app/journal-entries/${entry.id}`)
            },
            onError: (err) => setBanner(journalEntryErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
