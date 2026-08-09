import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { ItemForm } from '@/features/items/components/ItemForm'
import { useCreateItem } from '@/features/items/hooks/useItemMutations'
import { itemErrorMessage } from '@/features/items/lib/item-errors'
import { toast } from '@/lib/swal'

export function ItemCreatePage() {
  const { t } = useTranslation('items')
  const navigate = useNavigate()
  const createItem = useCreateItem()
  const [banner, setBanner] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/app/items"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('detail.back')}
      </Link>

      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        {t('create.title')}
      </h1>

      <ItemForm
        isPending={createItem.isPending}
        banner={banner}
        submitLabel={t('create.submit')}
        onSubmit={(dto) => {
          setBanner(null)
          createItem.mutate(dto, {
            onSuccess: (created) => {
              toast('success', t('create.created'))
              navigate(`/app/items/${created.id}`)
            },
            onError: (err) => setBanner(itemErrorMessage(err, t)),
          })
        }}
      />
    </div>
  )
}
