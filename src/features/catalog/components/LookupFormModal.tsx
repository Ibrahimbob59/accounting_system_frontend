import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/common/Modal'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import {
  useCreateLookup,
  useUpdateLookup,
} from '@/features/catalog/hooks/useLookupMutations'
import { useLookups } from '@/features/catalog/hooks/useLookups'
import { catalogErrorMessage } from '@/features/catalog/lib/catalog-errors'
import {
  localizedLookupName,
  type CatalogLookup,
  type CatalogLookupInput,
  type LookupKind,
} from '@/features/catalog/types/catalog.types'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import { localizedAccountName } from '@/features/accounts/types/accounts.types'
import { toast } from '@/lib/swal'

export function LookupFormModal({
  kind,
  lookup,
  open,
  onOpenChange,
}: {
  kind: LookupKind
  /** Present = edit. Absent = create. */
  lookup?: CatalogLookup
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('catalog')
  const title = lookup
    ? t('form.editTitle', { kind: t(`kinds.${kind}`) })
    : t('form.createTitle', { kind: t(`kinds.${kind}`) })

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      {/* Re-mount per target so react-hook-form re-seeds its defaults. */}
      {open && (
        <LookupFormBody
          key={lookup?.id ?? 'new'}
          kind={kind}
          lookup={lookup}
          onDone={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function LookupFormBody({
  kind,
  lookup,
  onDone,
}: {
  kind: LookupKind
  lookup?: CatalogLookup
  onDone: () => void
}) {
  const { t, i18n } = useTranslation('catalog')
  const lang = i18n.language
  const isCategory = kind === 'itemCategory'

  const categories = useLookups('itemCategory')
  const accounts = useAllAccounts()
  const createLookup = useCreateLookup(kind)
  const updateLookup = useUpdateLookup(kind)
  const [banner, setBanner] = useState<string | null>(null)

  const schema = z.object({
    name: z.string().min(1, t('form.validation.required')),
    nameAr: z.string().optional(),
    nameFr: z.string().optional(),
    nameEn: z.string().optional(),
    sortOrder: z
      .number({ message: t('form.validation.sortOrder') })
      .int(t('form.validation.sortOrder'))
      .min(0, t('form.validation.sortOrder'))
      .optional()
      .or(z.nan()),
    parentId: z.string().optional(),
    revenueAccountId: z.string().optional(),
    cogsAccountId: z.string().optional(),
  })
  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      name: lookup?.name ?? '',
      nameAr: lookup?.nameAr ?? '',
      nameFr: lookup?.nameFr ?? '',
      nameEn: lookup?.nameEn ?? '',
      sortOrder: lookup?.sortOrder ?? (undefined as unknown as number),
      parentId: lookup?.parentId ?? '',
      revenueAccountId: lookup?.revenueAccountId ?? '',
      cogsAccountId: lookup?.cogsAccountId ?? '',
    },
  })

  const accountOptions = (accounts.data ?? [])
    .filter((a) => a.isActive)
    .map((a) => ({
      value: a.id,
      label: `${a.number} — ${localizedAccountName(a, lang)}`,
    }))

  // A category can't be its own parent; the backend rejects deeper cycles.
  const parentOptions = (categories.data ?? [])
    .filter((c) => c.id !== lookup?.id)
    .map((c) => ({ value: c.id, label: localizedLookupName(c, lang) }))

  const isPending = createLookup.isPending || updateLookup.isPending

  const submit = (v: Values) => {
    setBanner(null)
    const opt = (s: string | undefined) => s?.trim() || undefined
    const input: CatalogLookupInput = {
      name: v.name.trim(),
      nameAr: opt(v.nameAr),
      nameFr: opt(v.nameFr),
      nameEn: opt(v.nameEn),
      sortOrder:
        typeof v.sortOrder === 'number' && Number.isFinite(v.sortOrder)
          ? v.sortOrder
          : undefined,
      ...(isCategory && {
        parentId: opt(v.parentId),
        revenueAccountId: opt(v.revenueAccountId),
        cogsAccountId: opt(v.cogsAccountId),
      }),
    }
    const onError = (err: unknown) => setBanner(catalogErrorMessage(err, t))
    const onSuccess = () => {
      toast('success', lookup ? t('saved') : t('created'))
      onDone()
    }
    if (lookup) {
      updateLookup.mutate({ id: lookup.id, input }, { onSuccess, onError })
    } else {
      createLookup.mutate(input, { onSuccess, onError })
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <TextField
        id="lookup-name"
        label={t('form.name')}
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id="lookup-nameAr"
          label={t('form.nameAr')}
          dir="rtl"
          {...register('nameAr')}
        />
        <TextField
          id="lookup-nameFr"
          label={t('form.nameFr')}
          {...register('nameFr')}
        />
        <TextField
          id="lookup-nameEn"
          label={t('form.nameEn')}
          {...register('nameEn')}
        />
      </div>

      {isCategory && (
        <>
          <SelectField
            id="lookup-parent"
            label={t('form.parent')}
            placeholder={t('form.noParent')}
            options={parentOptions}
            {...register('parentId')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="lookup-revenue"
              label={t('form.revenueAccount')}
              placeholder={t('form.accountDefault')}
              options={accountOptions}
              {...register('revenueAccountId')}
            />
            <SelectField
              id="lookup-cogs"
              label={t('form.cogsAccount')}
              placeholder={t('form.accountDefault')}
              options={accountOptions}
              {...register('cogsAccountId')}
            />
          </div>
        </>
      )}

      <TextField
        id="lookup-sortOrder"
        type="number"
        label={t('form.sortOrder')}
        error={errors.sortOrder?.message}
        {...register('sortOrder', { valueAsNumber: true })}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {t('form.save')}
        </Button>
      </div>
    </form>
  )
}
