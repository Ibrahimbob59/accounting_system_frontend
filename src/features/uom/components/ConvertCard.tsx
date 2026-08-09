import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/common/SelectField'
import { uomApi } from '@/features/uom/api/uom.api'
import { uomErrorMessage } from '@/features/uom/lib/uom-errors'
import {
  localizedUomName,
  type ConvertUomResult,
  type Uom,
} from '@/features/uom/types/uom.types'

/**
 * A small live converter over the selected category's units, backed by the
 * server's `GET /uoms/convert` (the same rounding the ledger uses). Handy for
 * sanity-checking that a category's factors are set up correctly.
 */
export function ConvertCard({ units }: { units: Uom[] }) {
  const { t, i18n } = useTranslation('uom')
  const lang = i18n.language

  const [qty, setQty] = useState('1')
  const [fromId, setFromId] = useState(units[0]?.id ?? '')
  const [toId, setToId] = useState(units[1]?.id ?? units[0]?.id ?? '')

  const convert = useMutation<ConvertUomResult, unknown>({
    mutationFn: () => uomApi.convert(Number(qty), fromId, toId),
  })

  const options = units.map((u) => ({
    value: u.id,
    label: localizedUomName(u, lang),
  }))
  const amount = Number(qty)
  const canConvert = Number.isFinite(amount) && amount > 0 && !!fromId && !!toId

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <h3 className="font-display text-sm font-bold text-text-primary">
        {t('convert.title')}
      </h3>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-24 space-y-2">
          <Label htmlFor="uom-convert-qty" className="field-label">
            {t('convert.qty')}
          </Label>
          <div className="field-box">
            <Input
              id="uom-convert-qty"
              type="number"
              step="0.000001"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>
        <SelectField
          className="w-[150px]"
          id="uom-convert-from"
          label={t('convert.from')}
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          options={options}
        />
        <SelectField
          className="w-[150px]"
          id="uom-convert-to"
          label={t('convert.to')}
          value={toId}
          onChange={(e) => setToId(e.target.value)}
          options={options}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!canConvert || convert.isPending}
          onClick={() => convert.mutate()}
        >
          {convert.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4 rtl:rotate-180" />
          )}
          {t('convert.action')}
        </Button>
      </div>

      {convert.isError && (
        <p className="text-[13px] text-danger">
          {uomErrorMessage(convert.error, t)}
        </p>
      )}
      {convert.data && (
        <p className="text-[15px] text-text-primary">
          {t('convert.result', {
            result: convert.data.result,
            unit: localizedUomName(
              units.find((u) => u.id === toId) ?? units[0],
              lang
            ),
          })}
        </p>
      )}
    </div>
  )
}
