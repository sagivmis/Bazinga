import type { EnsembleMemberConfig } from "./types"
import type { MemberWeightSweepAxis } from "./backtestSweepTypes"

export function defaultWeightAxes(
  members: EnsembleMemberConfig[],
  nameById: Record<string, string>
): MemberWeightSweepAxis[] {
  return members
    .filter((m) => m.enabled !== false)
    .map((m) => ({
      key: m.strategyId,
      strategyId: m.strategyId,
      label: nameById[m.strategyId] ?? m.strategyId,
      min: 10,
      max: 60,
      steps: 6,
      enabled: true
    }))
}
