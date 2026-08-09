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
  useCreateLocation,
  useUpdateLocation,
} from '@/features/stock/hooks/useLocations'
import { stockErrorMessage } from '@/features/stock/lib/stock-errors'
import type { StockLocation } from '@/features/stock/types/stock.types'
import { useBranches } from '@/features/branches/hooks/useBranches'
import { toast } from '@/lib/swal'

export function LocationFormModal({
  location,
  open,
  onOpenChange,
}: {
  location?: StockLocation
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('stock')
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={location ? t('locations.editTitle') : t('locations.createTitle')}
    >
      {open && (
        <Body
          key={location?.id ?? 'new'}
          location={location}
          onDone={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function Body({
  location,
  onDone,
}: {
  location?: StockLocation
  onDone: () => void
}) {
  const { t } = useTranslation('stock')
  const isEdit = !!location
  const branches = useBranches()
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()
  const [banner, setBanner] = useState<string | null>(null)

  const schema = z.object({
    code: z.string().min(1, t('locations.validation.required')),
    name: z.string().min(1, t('locations.validation.required')),
    nameAr: z.string().optional(),
    nameFr: z.string().optional(),
    nameEn: z.string().optional(),
    branchId: z.string().min(1, t('locations.validation.branchRequired')),
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
      code: location?.code ?? '',
      name: location?.name ?? '',
      nameAr: location?.nameAr ?? '',
      nameFr: location?.nameFr ?? '',
      nameEn: location?.nameEn ?? '',
      branchId: location?.branchId ?? '',
    },
  })

  const isPending = createLocation.isPending || updateLocation.isPending

  const submit = (v: Values) => {
    setBanner(null)
    const opt = (s: string | undefined) => s?.trim() || undefined
    const onError = (err: unknown) => setBanner(stockErrorMessage(err, t))
    const onSuccess = () => {
      toast('success', isEdit ? t('locations.saved') : t('locations.created'))
      onDone()
    }
    if (isEdit) {
      updateLocation.mutate(
        {
          id: location.id,
          input: {
            name: v.name.trim(),
            nameAr: opt(v.nameAr),
            nameFr: opt(v.nameFr),
            nameEn: opt(v.nameEn),
            branchId: v.branchId,
          },
        },
        { onSuccess, onError }
      )
    } else {
      createLocation.mutate(
        {
          code: v.code.trim(),
          name: v.name.trim(),
          nameAr: opt(v.nameAr),
          nameFr: opt(v.nameFr),
          nameEn: opt(v.nameEn),
          branchId: v.branchId,
        },
        { onSuccess, onError }
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="location-code"
          label={t('locations.code')}
          placeholder={t('locations.codePlaceholder')}
          disabled={isEdit}
          error={errors.code?.message}
          {...register('code')}
        />
        <SelectField
          id="location-branch"
          label={t('locations.branch')}
          placeholder={t('locations.branchPlaceholder')}
          options={(branches.data ?? []).map((b) => ({
            value: b.id,
            label: b.name,
          }))}
          error={errors.branchId?.message}
          {...register('branchId')}
        />
      </div>

      <TextField
        id="location-name"
        label={t('locations.name')}
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id="location-nameAr"
          label={t('locations.nameAr')}
          dir="rtl"
          {...register('nameAr')}
        />
        <TextField
          id="location-nameFr"
          label={t('locations.nameFr')}
          {...register('nameFr')}
        />
        <TextField
          id="location-nameEn"
          label={t('locations.nameEn')}
          {...register('nameEn')}
        />
      </div>

      {!branches.data?.length && (
        <p className="text-[13px] text-warning">{t('locations.noBranches')}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {t('locations.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {t('locations.save')}
        </Button>
      </div>
    </form>
  )
}
