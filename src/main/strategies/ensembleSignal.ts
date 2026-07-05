import type { Candle, EnsembleMemberConfig, StrategyParams } from "../../shared/types"
import { getStrategySignal } from "./registry"
import { num, type SignalFn, type TradeSignal } from "./signalTypes"

export const ENSEMBLE_STRATEGY_ID = "strategy-ensemble"

/** Weighted vote: LONG/SHORT wins when score ≥ threshold% of active weight and beats opposite */
export function computeEnsembleSignal(
  candles: Candle[],
  members: EnsembleMemberConfig[],
  sharedParams: StrategyParams
): TradeSignal | null {
  const active = members.filter((m) => m.enabled !== false && m.weight > 0)
  if (!active.length) return null

  let longScore = 0
  let shortScore = 0
  let totalWeight = 0

  for (const member of active) {
    totalWeight += member.weight
    const signal = getStrategySignal(member.strategyId, candles, member.params)
    if (signal === "LONG") longScore += member.weight
    else if (signal === "SHORT") shortScore += member.weight
  }

  if (totalWeight <= 0) return null

  const thresholdPct = num(sharedParams, "ensembleThreshold", 50)
  const minScore = totalWeight * (thresholdPct / 100)

  if (longScore >= minScore && longScore > shortScore) return "LONG"
  if (shortScore >= minScore && shortScore > longScore) return "SHORT"
  return null
}

export function createEnsembleSignalFn(members: EnsembleMemberConfig[]): SignalFn {
  return (candles, sharedParams) => computeEnsembleSignal(candles, members, sharedParams)
}

export function cloneEnsemble(members: EnsembleMemberConfig[]): EnsembleMemberConfig[] {
  return members.map((m) => ({
    strategyId: m.strategyId,
    weight: m.weight,
    enabled: m.enabled !== false,
    params: { ...m.params }
  }))
}

export function applyWeightToEnsemble(
  members: EnsembleMemberConfig[],
  strategyId: string,
  weight: number
): EnsembleMemberConfig[] {
  return members.map((m) =>
    m.strategyId === strategyId ? { ...m, weight: Math.max(0, weight) } : { ...m }
  )
}

export function applySweepToEnsemble(
  members: EnsembleMemberConfig[],
  params: StrategyParams,
  xKey: string,
  xValue: number,
  yKey: string,
  yValue: number
): { members: EnsembleMemberConfig[]; params: StrategyParams } {
  let nextMembers = cloneEnsemble(members)
  let nextParams = { ...params }

  for (const [key, value] of [
    [xKey, xValue],
    [yKey, yValue]
  ] as const) {
    if (key.startsWith("weight:")) {
      const sid = key.slice("weight:".length)
      nextMembers = applyWeightToEnsemble(nextMembers, sid, value)
    } else {
      nextParams = { ...nextParams, [key]: value }
    }
  }

  return { members: nextMembers, params: nextParams }
}

export function getMemberWeight(members: EnsembleMemberConfig[] | undefined, strategyId: string): number | undefined {
  return members?.find((m) => m.strategyId === strategyId)?.weight
}

export function isWeightParamKey(key: string): boolean {
  return key.startsWith("weight:")
}

export function weightParamKey(strategyId: string): string {
  return `weight:${strategyId}`
}
