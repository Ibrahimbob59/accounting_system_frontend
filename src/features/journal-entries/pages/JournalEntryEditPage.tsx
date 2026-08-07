import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { JournalEntryForm } from '@/features/journal-entries/components/JournalEntryForm'
import { useJournalEntry } from '@/features/journal-entries/hooks/useJournalEntry'
import { useUpdateJournalEntry } from '@/features/journal-entries/hooks/useJournalEntryMutations'
import { journalEntryErrorMessage } from '@/features/journal-entries/lib/journal-entry-errors'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { toast } from '@/lib/swal'

export function JournalEntryEditPage() {
  const { t } = useTranslation('journalEntries')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: entry, isLoading, isError, error } = useJournalEntry(id)
  const updateEntry = useUpdateJournalEntry()
  const [banner, setBanner] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !entry) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  // A posted entry is immutable — reverse it instead of editing. Bounce back to
  // the detail page rather than rendering a form that can only 409 on submit.
  if (entry.status !== 'DRAFT') {
    return <Navigate to={`/app/journal-entries/${entry.id}`} replace />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to={`/app/journal-entries/${entry.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('edit.back')}
      </Link>

      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        {t('edit.title')}
      </h1>

      <JournalEntryForm
        entry={entry}
        isPending={updateEntry.isPending}
        banner={banner}
        submitLabel={t('edit.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          updateEntry.mutate(
            { id: entry.id, dto },
            {
              onSuccess: () => {
                toast('success', t('edit.saved'))
                navigate(`/app/journal-entries/${entry.id}`)
              },
              onError: (err) => setBanner(journalEntryErrorMessage(err, t)),
            }
          )
        }}
      />
    </div>
  )
}
