import { FormSection, CompactField, FormRow } from "./CompactField"
import LeverageSlider from "./LeverageSlider"
import type { StrategyParams } from "../../shared/types"
import {
  clampLeverage,
  getLeverageMode,
  leverageRange,
  MAX_LEVERAGE,
  MIN_LEVERAGE
} from "../../../shared/leverageUtils"

interface LeverageParamsSectionProps {
  params: StrategyParams
  onChange: (patch: StrategyParams) => void
}

export function LeverageParamsSection({ params, onChange }: LeverageParamsSectionProps) {
  const mode = getLeverageMode(params)
  const leverage = clampLeverage(Number(params.leverage ?? 10))
  const range = leverageRange(params)

  return (
    <FormSection title="Leverage">
      <FormRow>
        <CompactField
          className="field-md"
          select
          label="Mode"
          value={mode}
          onChange={(e) =>
            onChange({
              ...params,
              leverageMode: e.target.value
            })
          }
          options={[
            { value: "fixed", label: "Fixed" },
            { value: "range", label: "Min / Max range" }
          ]}
        />
      </FormRow>

      {mode === "fixed" ? (
        <LeverageSlider
          label="Leverage"
          value={leverage}
          min={MIN_LEVERAGE}
          max={MAX_LEVERAGE}
          onChange={(v) => onChange({ ...params, leverage: v })}
          helperText="Fixed leverage for this strategy."
        />
      ) : (
        <>
          <FormRow>
            <CompactField
              className="field-sm"
              label="Min"
              type="number"
              value={params.leverageMin ?? range.min}
              onChange={(e) =>
                onChange({ ...params, leverageMin: clampLeverage(parseFloat(e.target.value) || 1) })
              }
              inputProps={{ min: MIN_LEVERAGE, max: MAX_LEVERAGE }}
            />
            <CompactField
              className="field-sm"
              label="Max"
              type="number"
              value={params.leverageMax ?? range.max}
              onChange={(e) =>
                onChange({ ...params, leverageMax: clampLeverage(parseFloat(e.target.value) || 1) })
              }
              inputProps={{ min: MIN_LEVERAGE, max: MAX_LEVERAGE }}
            />
          </FormRow>
          <LeverageSlider
            label="Active leverage"
            value={Math.min(Math.max(leverage, range.min), range.max)}
            min={range.min}
            max={range.max}
            onChange={(v) => onChange({ ...params, leverage: v })}
            helperText={`Adjustable within ${range.min}x–${range.max}x.`}
          />
        </>
      )}
    </FormSection>
  )
}

/** Compact leverage slider for order entry (local session only) */
export function OrderLeverageControl({
  leverage,
  onChange
}: {
  symbol?: string
  leverage: number
  onChange: (n: number) => void
}) {
  return (
    <LeverageSlider
      compact
      label="Leverage"
      value={leverage}
      onChange={onChange}
      helperText="Session-only — default in Settings."
    />
  )
}
