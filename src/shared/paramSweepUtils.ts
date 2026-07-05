import type { ParamSweepAxis } from "./backtestSweepTypes"
import { getTunableParams, type ParamField } from "./sweepUtils"
import type { StrategyParams } from "./types"

export function defaultParamAxes(schema: ParamField[], params: StrategyParams): ParamSweepAxis[] {
  const tunable = getTunableParams(schema)
  return tunable.map((f, i) => {
    const cur = Number(params[f.key] ?? f.default ?? 10)
    const isInt = Number.isInteger(cur) || f.key.toLowerCase().includes("period") || f.key.includes("bars")
    const min =
      f.min ??
      (isInt ? Math.max(1, Math.floor(cur * 0.6)) : Math.round(cur * 0.7 * 100) / 100)
    const max =
      f.max ??
      (isInt ? Math.max(min + 1, Math.ceil(cur * 1.5)) : Math.round(cur * 1.4 * 100) / 100)
    return {
      key: f.key,
      label: f.label,
      min,
      max,
      steps: 4,
      enabled: true
    }
  })
}

export { countParamSweepRuns } from "./backtestSweepTypes"

export function formatAxisValuesSummary(
  values: Record<string, number>,
  labels: Record<string, string>
): string {
  return Object.entries(values)
    .map(([key, v]) => `${labels[key] ?? key}: ${v}`)
    .join(" · ")
}
