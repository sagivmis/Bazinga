import type { KlineInterval } from "binance"
import type { EnsembleMemberConfig, StrategyParams } from "./types"

export interface BacktestSweepRequest {
  strategyId: string
  symbol: string
  interval: KlineInterval
  startTime: number
  endTime: number
  baseParams: StrategyParams
  initialBalance: number
  ensemble?: EnsembleMemberConfig[]
  paramX: { key: string; min: number; max: number; steps: number; label: string }
  paramY: { key: string; min: number; max: number; steps: number; label: string }
}

/** Per ensemble member weight axis for full grid sweep */
export interface MemberWeightSweepAxis {
  strategyId: string
  label: string
  min: number
  max: number
  steps: number
  enabled: boolean
}

export interface EnsembleMultiSweepRequest {
  symbol: string
  interval: KlineInterval
  startTime: number
  endTime: number
  baseParams: StrategyParams
  initialBalance: number
  /** Template members (params); weights overwritten per combination */
  ensemble: EnsembleMemberConfig[]
  weightAxes: MemberWeightSweepAxis[]
}

export interface HeatmapLabBootstrap {
  strategyId: string
  symbol: string
  interval: KlineInterval
  days: number
  params: StrategyParams
  ensemble: EnsembleMemberConfig[]
}

/** Pushed from Heatmap Lab → main app when user applies a cell */
export interface HeatmapApplyPayload {
  params: StrategyParams
  ensemble: EnsembleMemberConfig[]
  metrics?: import("./types").BacktestResult["metrics"]
  weights?: Record<string, number>
  source: "heatmap-lab"
}

export const MAX_ENSEMBLE_SWEEP_RUNS = 2500

export function countEnsembleSweepRuns(axes: MemberWeightSweepAxis[]): number {
  const enabled = axes.filter((a) => a.enabled && a.steps > 0)
  return enabled.reduce((product, a) => product * Math.max(1, a.steps), 1)
}
