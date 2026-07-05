import type { MemberWeightSweepAxis } from "../../shared/backtestSweepTypes"
import { buildParamCombinations as buildAxes } from "./paramSweep"
import type { EnsembleMemberConfig } from "../../shared/types"

export { defaultWeightAxes } from "../../shared/ensembleSweepUtils"

export function buildWeightCombinations(
  axes: MemberWeightSweepAxis[]
): Record<string, number>[] {
  return buildAxes(
    axes.map((a) => ({ ...a, key: a.strategyId ?? a.key })),
    (id) => `weight:${id}`
  )
}

export function applyWeightCombination(
  template: EnsembleMemberConfig[],
  weights: Record<string, number>
): EnsembleMemberConfig[] {
  return template.map((m) => ({
    ...m,
    weight: weights[m.strategyId] ?? m.weight,
    params: { ...m.params }
  }))
}
