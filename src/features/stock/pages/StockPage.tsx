import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OnHandTab } from '@/features/stock/components/OnHandTab'
import { MovementsTab } from '@/features/stock/components/MovementsTab'
import { ValuationTab } from '@/features/stock/components/ValuationTab'
import { LocationsTab } from '@/features/stock/components/LocationsTab'

type StockTab = 'on-hand' | 'movements' | 'valuation' | 'locations'

export function StockPage() {
  const { t } = useTranslation('stock')
  const [tab, setTab] = useState<StockTab>('on-hand')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">{t('subtitle')}</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as StockTab)}>
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 border-b border-border p-0"
        >
          <TabsTrigger value="on-hand" className="flex-none px-1 py-2.5">
            {t('tabs.onHand')}
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex-none px-1 py-2.5">
            {t('tabs.movements')}
          </TabsTrigger>
          <TabsTrigger value="valuation" className="flex-none px-1 py-2.5">
            {t('tabs.valuation')}
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex-none px-1 py-2.5">
            {t('tabs.locations')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="on-hand" className="pt-6">
          <OnHandTab />
        </TabsContent>
        <TabsContent value="movements" className="pt-6">
          <MovementsTab />
        </TabsContent>
        <TabsContent value="valuation" className="pt-6">
          <ValuationTab />
        </TabsContent>
        <TabsContent value="locations" className="pt-6">
          <LocationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
