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
    <section className="mx-auto max-w-4xl px-6 py-20">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          {t('features.heading')}
        </h2>
        <p className="ledger-rule mt-3 text-text-secondary">
          {t('features.subheading')}
        </p>
      </div>

      {/* A ledger, not a card grid — each feature is a full-width line item
          (icon + name, then description), separated by hairlines. */}
      <dl className="mt-10 divide-y divide-border">
        {FEATURES.map(({ key, Icon }) => (
          <div
            key={key}
            className="flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:gap-8"
          >
            <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
              <Icon className="size-5 shrink-0 text-secondary-700" />
              <dt className="font-semibold text-text-primary">
                {t(`features.${key}.title`)}
              </dt>
            </div>
            <dd className="text-text-secondary sm:flex-1">
              {t(`features.${key}.desc`)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
