import type { MemberWeightSweepAxis } from "../../shared/backtestSweepTypes"
import { linspace, formatSweepValue } from "../../shared/sweepUtils"
import type { EnsembleMemberConfig } from "../../shared/types"

export { defaultWeightAxes } from "../../shared/ensembleSweepUtils"

export function buildWeightCombinations(
  axes: MemberWeightSweepAxis[]
): Record<string, number>[] {
  const enabled = axes.filter((a) => a.enabled && a.steps > 0)
  if (!enabled.length) return []

  const build = (index: number): Record<string, number>[] => {
    if (index >= enabled.length) return [{}]
    const axis = enabled[index]
    const values = linspace(axis.min, axis.max, axis.steps).map((v) =>
      formatSweepValue(`weight:${axis.strategyId}`, v)
    )
    const rest = build(index + 1)
    const out: Record<string, number>[] = []
    for (const v of values) {
      for (const combo of rest) {
        out.push({ ...combo, [axis.strategyId]: v })
      }
    }
    return out
  }

  return build(0)
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
