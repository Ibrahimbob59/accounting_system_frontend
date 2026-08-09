import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { ItemForm } from '@/features/items/components/ItemForm'
import { useItem } from '@/features/items/hooks/useItem'
import { useUpdateItem } from '@/features/items/hooks/useItemMutations'
import { itemErrorMessage } from '@/features/items/lib/item-errors'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { toast } from '@/lib/swal'

export function ItemEditPage() {
  const { t } = useTranslation('items')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading, isError, error } = useItem(id)
  const updateItem = useUpdateItem()
  const [banner, setBanner] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  if (isError || !item) {
    return (
      <p className="py-8 text-center text-text-muted">
        {isPermissionDenied(error)
          ? t('errors.permissionDeniedSection')
          : t('errors.generic')}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to={`/app/items/${item.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('edit.back')}
      </Link>

      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        {t('edit.title', { code: item.code })}
      </h1>

      <ItemForm
        item={item}
        isPending={updateItem.isPending}
        banner={banner}
        submitLabel={t('edit.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          updateItem.mutate(
            { id: item.id, dto },
            {
              onSuccess: () => {
                toast('success', t('edit.saved'))
                navigate(`/app/items/${item.id}`)
              },
              onError: (err) => setBanner(itemErrorMessage(err, t)),
            }
          )
        }}
      />
    </div>
  )
}
