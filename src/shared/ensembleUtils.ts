import type { EnsembleMemberConfig } from "./types"
import type { ParamField } from "./sweepUtils"

export function isWeightParamKey(key: string): boolean {
  return key.startsWith("weight:")
}

export function weightParamKey(strategyId: string): string {
  return `weight:${strategyId}`
}

export function getEnsembleTunableParams(
  schema: ParamField[],
  members: EnsembleMemberConfig[],
  nameById: Record<string, string>
): ParamField[] {
  const weightFields: ParamField[] = members
    .filter((m) => m.enabled !== false)
    .map((m) => ({
      key: weightParamKey(m.strategyId),
      label: `Weight: ${nameById[m.strategyId] ?? m.strategyId}`,
      type: "number" as const,
      default: m.weight,
      min: 0,
      max: 100
    }))

  const shared = schema.filter(
    (f) =>
      f.type === "number" &&
      f.key !== "notionalUsd" &&
      f.key !== "stopLossPct" &&
      f.key !== "takeProfitPct"
  )

  return [...weightFields, ...shared]
}

export function defaultEnsembleSweepAxes(
  members: EnsembleMemberConfig[],
  schema: ParamField[]
): { xKey: string; yKey: string } {
  const enabled = members.filter((m) => m.enabled !== false)
  if (enabled.length >= 2) {
    return {
      xKey: weightParamKey(enabled[0].strategyId),
      yKey: weightParamKey(enabled[1].strategyId)
    }
  }
  const tunable = getEnsembleTunableParams(schema, members, {})
  return {
    xKey: tunable[0]?.key ?? "ensembleThreshold",
    yKey: tunable[1]?.key ?? "cooldownBars"
  }
}

export function resolveSweepValue(
  params: Record<string, number | string | boolean>,
  ensemble: EnsembleMemberConfig[] | undefined,
  key: string
): number | undefined {
  if (isWeightParamKey(key)) {
    const sid = key.slice("weight:".length)
    const w = ensemble?.find((m) => m.strategyId === sid)?.weight
    return w !== undefined ? Number(w) : undefined
  }
  const v = params[key]
  return v !== undefined ? Number(v) : undefined
}

export function normalizeEnsembleWeights(members: EnsembleMemberConfig[]): EnsembleMemberConfig[] {
  const active = members.filter((m) => m.enabled !== false && m.weight > 0)
  const total = active.reduce((s, m) => s + m.weight, 0)
  if (total <= 0) return members
  return members.map((m) =>
    m.enabled === false || m.weight <= 0
      ? m
      : { ...m, weight: Math.round((m.weight / total) * 100) }
  )
}

export function defaultEnsembleMembers(): EnsembleMemberConfig[] {
  return [
    {
      strategyId: "wyckoff-spring",
      weight: 40,
      enabled: true,
      params: {
        rangePeriod: 48,
        sweepPct: 0.3,
        volumePeriod: 20,
        volumeMultiplier: 1.8
      }
    },
    {
      strategyId: "volume-breakout",
      weight: 35,
      enabled: true,
      params: {
        channelPeriod: 55,
        volumePeriod: 20,
        volumeMultiplier: 2.0
      }
    },
    {
      strategyId: "high-volume-trend",
      weight: 25,
      enabled: true,
      params: {
        trendEmaPeriod: 100,
        pullbackLookback: 5,
        volumePeriod: 20,
        entryVolumeMultiplier: 2.0,
        pullbackVolumeMax: 0.7
      }
    }
  ]
}

export const ENSEMBLE_STRATEGY_ID = "strategy-ensemble"
