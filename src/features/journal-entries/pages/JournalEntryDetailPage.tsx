import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2, Pencil, Send, Trash2, Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { JournalStatusBadge } from '@/features/journal-entries/components/JournalStatusBadge'
import { ReverseEntryDialog } from '@/features/journal-entries/components/ReverseEntryDialog'
import { useJournalEntry } from '@/features/journal-entries/hooks/useJournalEntry'
import {
  useDeleteJournalEntry,
  usePostJournalEntry,
  useReverseJournalEntry,
} from '@/features/journal-entries/hooks/useJournalEntryMutations'
import { journalEntryErrorMessage } from '@/features/journal-entries/lib/journal-entry-errors'
import type { JournalLine } from '@/features/journal-entries/types/journal-entries.types'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import { localizedAccountName } from '@/features/accounts/types/accounts.types'
import {
  isPermissionDenied,
  usePermission,
} from '@/features/auth/lib/permissions'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'
import { confirm, toast } from '@/lib/swal'

export function JournalEntryDetailPage() {
  const { t, i18n } = useTranslation('journalEntries')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: entry, isLoading, isError, error } = useJournalEntry(id)
  const allAccounts = useAllAccounts()
  const lookupCurrency = useCurrencyLookup()

  const postEntry = usePostJournalEntry()
  const deleteEntry = useDeleteJournalEntry()
  const reverseEntry = useReverseJournalEntry()
  const [reverseOpen, setReverseOpen] = useState(false)

  const canUpdate = usePermission('journalentry.update')
  const canDelete = usePermission('journalentry.delete')
  const canPost = usePermission('journalentry.post')
  const canReverse = usePermission('journalentry.reverse')

  // Self-describing: the base currency comes off the entry (read from its
  // lines by the backend), not the mutable company setting.
  const companyCurrency = entry?.baseCurrencyCode ?? undefined
  const baseCurrency = companyCurrency
    ? lookupCurrency(companyCurrency)
    : undefined

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

  const accountLabel = (accountId: string): string => {
    const account = allAccounts.data?.find((a) => a.id === accountId)
    return account
      ? `${account.number} — ${localizedAccountName(account, i18n.language)}`
      : accountId
  }

  const isDraft = entry.status === 'DRAFT'
  const busy =
    postEntry.isPending || deleteEntry.isPending || reverseEntry.isPending

  const handlePost = async () => {
    const ok = await confirm({
      title: t('actions.postConfirm.title'),
      description: t('actions.postConfirm.body'),
      confirmLabel: t('actions.postConfirm.confirm'),
      cancelLabel: t('actions.postConfirm.cancel'),
    })
    if (!ok) return
    postEntry.mutate(entry.id, {
      onSuccess: () => toast('success', t('actions.posted')),
      onError: (err) => toast('error', journalEntryErrorMessage(err, t)),
    })
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('actions.deleteConfirm.title'),
      description: t('actions.deleteConfirm.body'),
      confirmLabel: t('actions.deleteConfirm.confirm'),
      cancelLabel: t('actions.deleteConfirm.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    deleteEntry.mutate(entry.id, {
      onSuccess: () => {
        toast('success', t('actions.deleted'))
        navigate('/app/journal-entries')
      },
      onError: (err) => toast('error', journalEntryErrorMessage(err, t)),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/journal-entries"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {entry.entryNumber ? (
              <span className="font-mono">{entry.entryNumber}</span>
            ) : (
              t('draftPlaceholder')
            )}
          </h1>
          <JournalStatusBadge
            status={entry.status}
            isReversal={!!entry.reversalOfId}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft ? (
            <>
              {canUpdate && (
                <Button variant="outline" asChild>
                  <Link to={`/app/journal-entries/${entry.id}/edit`}>
                    <Pencil className="size-4" />
                    {t('actions.edit')}
                  </Link>
                </Button>
              )}
              {canPost && (
                <Button onClick={() => void handlePost()} disabled={busy}>
                  <Send className="size-4" />
                  {t('actions.post')}
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  onClick={() => void handleDelete()}
                  disabled={busy}
                >
                  <Trash2 className="size-4" />
                  {t('actions.delete')}
                </Button>
              )}
            </>
          ) : (
            // A reversal is the only change allowed on a posted entry; an entry
            // already reversed can't be reversed again (backend 409).
            canReverse &&
            !entry.reversalOfId && (
              <Button
                variant="outline"
                onClick={() => setReverseOpen(true)}
                disabled={busy}
              >
                <Undo2 className="size-4" />
                {t('actions.reverse')}
              </Button>
            )
          )}
        </div>
      </div>

      <Section title={t('detail.sections.details')}>
        <InfoRow
          label={t('detail.date')}
          value={formatDate(entry.date, i18n.language)}
        />
        <InfoRow
          label={t('detail.reference')}
          value={entry.reference || t('detail.notSet')}
        />
        <InfoRow
          label={t('detail.description')}
          value={entry.description || t('detail.notSet')}
        />
        <InfoRow
          label={t('detail.postedAt')}
          value={
            entry.postedAt
              ? formatDate(entry.postedAt, i18n.language)
              : t('detail.notPosted')
          }
        />
      </Section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          {t('detail.sections.lines')}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t('detail.lines.account')}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  {t('detail.lines.memo')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('detail.lines.debit')}
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  {t('detail.lines.credit')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...entry.lines]
                .sort((a, b) => a.lineNo - b.lineNo)
                .map((line) => (
                  <LineRow
                    key={line.id}
                    line={line}
                    account={accountLabel(line.accountId)}
                    lookupCurrency={lookupCurrency}
                    baseCurrency={companyCurrency}
                    locale={i18n.language}
                  />
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold text-text-primary">
                <td className="px-4 py-2.5" colSpan={2}>
                  {t('detail.lines.total')}
                </td>
                <td className="px-4 py-2.5 text-end font-mono">
                  {formatMoney(
                    entry.totalDebitBase,
                    baseCurrency,
                    i18n.language
                  )}
                </td>
                <td className="px-4 py-2.5 text-end font-mono">
                  {formatMoney(
                    entry.totalCreditBase,
                    baseCurrency,
                    i18n.language
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-[13px] text-text-muted">
          {entry.isBalanced ? t('detail.balanced') : t('detail.unbalanced')}
          {' · '}
          {t('detail.baseNote', { currency: companyCurrency ?? '—' })}
        </p>
      </section>

      <ReverseEntryDialog
        open={reverseOpen}
        onOpenChange={setReverseOpen}
        isPending={reverseEntry.isPending}
        onConfirm={(dto) =>
          reverseEntry.mutate(
            { id: entry.id, dto },
            {
              onSuccess: (reversal) => {
                setReverseOpen(false)
                toast('success', t('actions.reversed'))
                navigate(`/app/journal-entries/${reversal.id}`)
              },
              onError: (err) =>
                toast('error', journalEntryErrorMessage(err, t)),
            }
          )
        }
      />
    </div>
  )
}

/** One journal line. The primary amount is shown in the line's OWN currency
 * (self-describing); when that differs from the company base a muted sub-line
 * gives the frozen base equivalent, so a foreign-currency line still reconciles
 * to the base totals in the footer. */
function LineRow({
  line,
  account,
  lookupCurrency,
  baseCurrency,
  locale,
}: {
  line: JournalLine
  account: string
  lookupCurrency: (
    code: string
  ) => { code: string; decimalPlaces: number } | undefined
  baseCurrency: string | undefined
  locale: string
}) {
  const isDebit = line.side === 'DEBIT'
  const original = formatMoney(
    line.amountOriginal,
    lookupCurrency(line.currency),
    locale
  )
  const showBase = line.currency !== baseCurrency
  const base = showBase
    ? formatMoney(
        line.amountBase,
        baseCurrency ? lookupCurrency(baseCurrency) : undefined,
        locale
      )
    : null

  const amountCell = (
    <div className="flex flex-col items-end">
      <span className="font-mono">{original}</span>
      {base && (
        <span className="font-mono text-[12px] text-text-muted">{base}</span>
      )}
    </div>
  )

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-4 py-2.5 text-text-primary">{account}</td>
      <td className="px-4 py-2.5 text-text-muted">{line.description || '—'}</td>
      <td className="px-4 py-2.5 text-end">{isDebit ? amountCell : ''}</td>
      <td className="px-4 py-2.5 text-end">{isDebit ? '' : amountCell}</td>
    </tr>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-bold text-text-primary">
        {title}
      </h2>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-text-primary">{value}</dd>
    </div>
  )
}
