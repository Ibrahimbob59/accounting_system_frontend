import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/common/Modal'
import { TextField } from '@/components/common/TextField'
import { FormBanner } from '@/components/common/FormBanner'
import {
  useCreateUomCategory,
  useUpdateUomCategory,
} from '@/features/uom/hooks/useUomMutations'
import { uomErrorMessage } from '@/features/uom/lib/uom-errors'
import type { UomCategory } from '@/features/uom/types/uom.types'
import { toast } from '@/lib/swal'

export function UomCategoryFormModal({
  category,
  open,
  onOpenChange,
}: {
  category?: UomCategory
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('uom')
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={category ? t('category.editTitle') : t('category.createTitle')}
    >
      {open && (
        <Body
          key={category?.id ?? 'new'}
          category={category}
          onDone={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function Body({
  category,
  onDone,
}: {
  category?: UomCategory
  onDone: () => void
}) {
  const { t } = useTranslation('uom')
  const createCategory = useCreateUomCategory()
  const updateCategory = useUpdateUomCategory()
  const [banner, setBanner] = useState<string | null>(null)

  const schema = z.object({
    name: z.string().min(1, t('validation.required')),
    nameAr: z.string().optional(),
    nameFr: z.string().optional(),
    nameEn: z.string().optional(),
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
      name: category?.name ?? '',
      nameAr: category?.nameAr ?? '',
      nameFr: category?.nameFr ?? '',
      nameEn: category?.nameEn ?? '',
    },
  })

  const isPending = createCategory.isPending || updateCategory.isPending

  const submit = (v: Values) => {
    setBanner(null)
    const opt = (s: string | undefined) => s?.trim() || undefined
    const input = {
      name: v.name.trim(),
      nameAr: opt(v.nameAr),
      nameFr: opt(v.nameFr),
      nameEn: opt(v.nameEn),
    }
    const onError = (err: unknown) => setBanner(uomErrorMessage(err, t))
    const onSuccess = () => {
      toast('success', category ? t('saved') : t('created'))
      onDone()
    }
    if (category) {
      updateCategory.mutate({ id: category.id, input }, { onSuccess, onError })
    } else {
      createCategory.mutate(input, { onSuccess, onError })
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}
      <TextField
        id="uomcat-name"
        label={t('category.name')}
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id="uomcat-nameAr"
          label={t('category.nameAr')}
          dir="rtl"
          {...register('nameAr')}
        />
        <TextField
          id="uomcat-nameFr"
          label={t('category.nameFr')}
          {...register('nameFr')}
        />
        <TextField
          id="uomcat-nameEn"
          label={t('category.nameEn')}
          {...register('nameEn')}
        />
      </div>
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
