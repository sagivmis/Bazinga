import type { ParamSweepAxis } from "../../shared/backtestSweepTypes"
import { linspace, formatSweepValue } from "../../shared/sweepUtils"
import type { StrategyParams } from "../../shared/types"

export function buildParamCombinations(
  axes: ParamSweepAxis[],
  sweepKey: (axisKey: string) => string = (k) => k
): Record<string, number>[] {
  const enabled = axes.filter((a) => a.enabled && a.steps > 0)
  if (!enabled.length) return []

  const build = (index: number): Record<string, number>[] => {
    if (index >= enabled.length) return [{}]
    const axis = enabled[index]
    const values = linspace(axis.min, axis.max, axis.steps).map((v) =>
      formatSweepValue(sweepKey(axis.key), v)
    )
    const rest = build(index + 1)
    const out: Record<string, number>[] = []
    for (const v of values) {
      for (const combo of rest) {
        out.push({ ...combo, [axis.key]: v })
      }
    }
    return out
  }

  return build(0)
}

export function applyParamCombination(
  baseParams: StrategyParams,
  combo: Record<string, number>
): StrategyParams {
  return { ...baseParams, ...combo }
}
