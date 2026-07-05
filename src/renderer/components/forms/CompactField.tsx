import { TextField, MenuItem } from "@mui/material"
import type { TextFieldProps } from "@mui/material"
import type { ReactNode } from "react"
import "./form-layout.css"

type CompactFieldProps = Omit<TextFieldProps, "size"> & {
  options?: { value: string; label: string }[]
}

/** Small field sized to its grid cell — not full panel width */
export function CompactField({ options, select, className, ...props }: CompactFieldProps) {
  if (select && options) {
    return (
      <TextField
        {...props}
        select
        size="small"
        className={`compact-field ${className ?? ""}`}
        SelectProps={{
          ...props.SelectProps,
          MenuProps: { PaperProps: { sx: { maxHeight: 280 } } }
        }}
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value} dense>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
    )
  }

  return (
    <TextField {...props} size="small" className={`compact-field ${className ?? ""}`} />
  )
}

export function FormSection({
  title,
  description,
  children
}: {
  title?: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="form-section">
      {title && <p className="form-section-title">{title}</p>}
      {description && <p className="form-section-desc">{description}</p>}
      {children}
    </div>
  )
}

export function FormGrid({
  children,
  wide
}: {
  children: ReactNode
  wide?: boolean
}) {
  return <div className={`form-grid${wide ? " form-grid-wide" : ""}`}>{children}</div>
}

export function FormRow({ children }: { children: ReactNode }) {
  return <div className="form-row">{children}</div>
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="form-actions">{children}</div>
}

/** Shorter labels for tight grids; full label in tooltip */
export function shortParamLabel(label: string): string {
  const aliases: Record<string, string> = {
    "Range Lookback": "Range bars",
    "Sweep Beyond Range %": "Sweep %",
    "Volume Avg Period": "Vol period",
    "Min Volume × Avg": "Vol × avg",
    "Breakout Volume × Avg": "Break vol ×",
    "Max Range Width %": "Max range %",
    "Consolidation Bars": "Consol. bars",
    "Channel Period": "Channel",
    "Entry Volume × Avg": "Entry vol ×",
    "Max Pullback Vol Ratio": "Pullback vol",
    "Pullback Bars": "Pullback",
    "Signal Threshold %": "Threshold %",
    "Stop Loss %": "Stop %",
    "Take Profit %": "TP %",
    "Cooldown Bars": "Cooldown",
    "Notional USD": "Margin $",
    "Price Band %": "Band %",
    "Risk % per trade": "Risk %",
    "Trend EMA": "Trend EMA"
  }
  return aliases[label] ?? label
}

export type ParamFieldLike = {
  key: string
  label: string
  type: string
  default?: unknown
  min?: number
  max?: number
}

export function StrategyParamsGrid({
  fields,
  values,
  onChange
}: {
  fields: ParamFieldLike[]
  values: Record<string, unknown>
  onChange: (key: string, value: number | string) => void
}) {
  if (!fields.length) return null

  return (
    <FormGrid>
      {fields.map((field) => (
        <CompactField
          key={field.key}
          label={shortParamLabel(field.label)}
          title={field.label}
          type={field.type === "number" ? "number" : "text"}
          value={values[field.key] ?? field.default ?? ""}
          onChange={(e) =>
            onChange(
              field.key,
              field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
            )
          }
          inputProps={
            field.type === "number"
              ? { min: field.min, max: field.max, step: "any" }
              : undefined
          }
        />
      ))}
    </FormGrid>
  )
}
