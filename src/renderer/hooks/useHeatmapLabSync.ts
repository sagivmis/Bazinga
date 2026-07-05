import { useEffect } from "react"
import { IPC } from "../../shared/ipc"
import type { HeatmapApplyPayload } from "../../shared/backtestSweepTypes"
import type { EnsembleMemberConfig, StrategyParams } from "../../shared/types"

type ApplyHandler = (
  params: StrategyParams,
  ensemble: EnsembleMemberConfig[],
  payload: HeatmapApplyPayload
) => void

/** Listen for Heatmap Lab apply events and push config into the main app. */
export function useHeatmapLabSync(onApply: ApplyHandler) {
  useEffect(() => {
    if (!window.api) return
    const unsub = window.api.on(IPC.EVENT_HEATMAP_APPLY, (_, data) => {
      const payload = data as HeatmapApplyPayload
      onApply(payload.params, payload.ensemble, payload)
    })
    return () => unsub?.()
  }, [onApply])
}

export function cellToApplyPayload(
  params: StrategyParams,
  ensemble: EnsembleMemberConfig[],
  weights: Record<string, number>,
  metrics?: HeatmapApplyPayload["metrics"]
): HeatmapApplyPayload {
  return {
    params: { ...params },
    ensemble: ensemble.map((m) => ({ ...m, params: { ...m.params } })),
    weights: { ...weights },
    metrics,
    source: "heatmap-lab"
  }
}
