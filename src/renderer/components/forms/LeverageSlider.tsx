import { Box, Slider, Typography } from "@mui/material"
import { clampLeverage, MAX_LEVERAGE, MIN_LEVERAGE } from "../../../shared/leverageUtils"

export interface LeverageSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  helperText?: string
  compact?: boolean
}

export default function LeverageSlider({
  value,
  onChange,
  min = MIN_LEVERAGE,
  max = MAX_LEVERAGE,
  label = "Leverage",
  helperText,
  compact
}: LeverageSliderProps) {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  const current = clampLeverage(value, lo, hi)

  return (
    <Box className={`leverage-slider${compact ? " leverage-slider--compact" : ""}`}>
      <Typography
        variant="caption"
        component="div"
        sx={{
          color: "var(--text-muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 0.5
        }}
      >
        <span>{label}</span>
        <strong style={{ color: "var(--accent-teal)", fontSize: compact ? 12 : 13 }}>{current}x</strong>
      </Typography>
      <Slider
        size="small"
        value={current}
        min={lo}
        max={hi}
        step={1}
        marks={[
          { value: lo, label: `${lo}x` },
          { value: hi, label: `${hi}x` }
        ]}
        onChange={(_, v) => onChange(clampLeverage(v as number, lo, hi))}
        sx={{
          color: "var(--accent-teal)",
          "& .MuiSlider-markLabel": { fontSize: 10, color: "var(--text-muted)" }
        }}
      />
      {helperText && (
        <Typography variant="caption" sx={{ color: "var(--text-muted)", display: "block", mt: 0.25 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  )
}
