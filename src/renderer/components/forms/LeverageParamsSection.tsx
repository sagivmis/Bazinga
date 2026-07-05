import { FormSection, CompactField, FormRow } from "./CompactField"
import type { StrategyParams } from "../../shared/types"
import {
  clampLeverage,
  getLeverageMode,
  leverageRange,
  MAX_LEVERAGE,
  MIN_LEVERAGE
} from "../../../shared/leverageUtils"
import { Slider, Typography } from "@mui/material"

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
        {mode === "fixed" ? (
          <CompactField
            className="field-sm"
            label="Leverage"
            type="number"
            value={leverage}
            disabled
            title="Fixed leverage — change mode to Range to adjust"
            inputProps={{ min: MIN_LEVERAGE, max: MAX_LEVERAGE }}
          />
        ) : (
          <>
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
          </>
        )}
      </FormRow>

      {mode === "range" && (
        <div style={{ marginTop: 8, maxWidth: 280 }}>
          <Typography variant="caption" sx={{ color: "var(--text-muted)" }}>
            Active leverage: {leverage}x (within {range.min}–{range.max})
          </Typography>
          <Slider
            size="small"
            value={Math.min(Math.max(leverage, range.min), range.max)}
            min={range.min}
            max={range.max}
            step={1}
            marks={[
              { value: range.min, label: `${range.min}x` },
              { value: range.max, label: `${range.max}x` }
            ]}
            onChange={(_, v) => onChange({ ...params, leverage: v as number })}
            sx={{ mt: 0.5 }}
          />
        </div>
      )}

      {mode === "fixed" && (
        <Typography variant="caption" sx={{ color: "var(--text-muted)", display: "block", mt: 0.5 }}>
          Fixed at {leverage}x — switch to Range to allow adjustment within bounds.
        </Typography>
      )}
    </FormSection>
  )
}

/** Compact leverage control for order entry (local session only) */
export function OrderLeverageControl({
  leverage,
  onChange
}: {
  symbol?: string
  leverage: number
  onChange: (n: number) => void
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <FormRow>
        <CompactField
          className="field-sm"
          label={`Leverage`}
          type="number"
          value={leverage}
          onChange={(e) => onChange(clampLeverage(parseFloat(e.target.value) || 1))}
          inputProps={{ min: MIN_LEVERAGE, max: MAX_LEVERAGE, step: 1 }}
        />
      </FormRow>
      <div className="leverage-presets">
        {[5, 10, 20, 50, 100].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}>
            {n}x
          </button>
        ))}
      </div>
    </div>
  )
}
