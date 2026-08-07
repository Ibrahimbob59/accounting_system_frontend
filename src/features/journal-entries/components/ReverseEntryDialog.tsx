import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/common/Modal'
import { TextField } from '@/components/common/TextField'
import { TextareaField } from '@/components/common/TextareaField'
import type { ReverseJournalEntryDto } from '@/features/journal-entries/types/journal-entries.types'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Captures the two optional inputs a reversal takes — the date of the reversing
 * entry (defaults to today) and a reason stored on it. The base amounts are
 * copied from the original by the backend, never re-rated, so there is nothing
 * else to collect here.
 */
export function ReverseEntryDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (dto: ReverseJournalEntryDto) => void
  isPending: boolean
}) {
  const { t } = useTranslation('journalEntries')
  const [date, setDate] = useState(today())
  const [reason, setReason] = useState('')

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('reverse.title')}
      description={t('reverse.body')}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('reverse.cancel')}
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                date: date || undefined,
                reason: reason.trim() || undefined,
              })
            }
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {t('reverse.confirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          id="je-reverse-date"
          type="date"
          label={t('reverse.date')}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <TextareaField
          id="je-reverse-reason"
          label={t('reverse.reason')}
          placeholder={t('reverse.reasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  )
}
