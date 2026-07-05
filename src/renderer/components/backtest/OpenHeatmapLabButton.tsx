import { Button } from "@mui/material"
import GridOnIcon from "@mui/icons-material/GridOn"
import type { EnsembleMemberConfig, StrategyParams } from "../../../shared/types"
import type { HeatmapLabBootstrap } from "../../../shared/backtestSweepTypes"

interface OpenHeatmapLabButtonProps {
  strategyId: string
  symbol: string
  interval: string
  days: number
  params: StrategyParams
  ensemble: EnsembleMemberConfig[]
  disabled?: boolean
  size?: "small" | "medium" | "large"
  variant?: "outlined" | "contained" | "text"
}

export default function OpenHeatmapLabButton({
  strategyId,
  symbol,
  interval,
  days,
  params,
  ensemble,
  disabled,
  size = "small",
  variant = "outlined"
}: OpenHeatmapLabButtonProps) {
  const open = async () => {
    if (!window.api?.heatmap) return
    const bootstrap: HeatmapLabBootstrap = {
      strategyId,
      symbol,
      interval: interval as HeatmapLabBootstrap["interval"],
      days,
      params: { ...params },
      ensemble: ensemble.map((m) => ({ ...m, params: { ...m.params } }))
    }
    await window.api.heatmap.setBootstrap(bootstrap)
    await window.api.heatmap.openLab()
  }

  return (
    <Button
      variant={variant}
      color="secondary"
      size={size}
      startIcon={<GridOnIcon />}
      disabled={disabled}
      onClick={() => void open()}
      title="Open Heatmap Lab to sweep all tunable parameters"
    >
      Open Heatmap Lab
    </Button>
  )
}
