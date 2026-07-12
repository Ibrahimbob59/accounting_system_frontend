import { useTranslation } from 'react-i18next'
import {
  Coins,
  BookOpenCheck,
  Boxes,
  ShoppingCart,
  Users,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const FEATURES: { key: string; Icon: LucideIcon }[] = [
  { key: 'dualCurrency', Icon: Coins },
  { key: 'accounting', Icon: BookOpenCheck },
  { key: 'inventory', Icon: Boxes },
  { key: 'pos', Icon: ShoppingCart },
  { key: 'roles', Icon: Users },
  { key: 'audit', Icon: ShieldCheck },
]

export function FeatureGrid() {
  const { t } = useTranslation('landing')

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">
          {t('features.heading')}
        </h2>
        <p className="mt-3 text-text-secondary">{t('features.subheading')}</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ key, Icon }) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-surface p-6 shadow-xs"
          >
            <div className="flex size-11 items-center justify-center rounded-md bg-primary-100 text-primary-900">
              <Icon className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-text-primary">
              {t(`features.${key}.title`)}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              {t(`features.${key}.desc`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
