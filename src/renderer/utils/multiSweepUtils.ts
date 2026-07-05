import type { BacktestSweepCell, BacktestResult } from "../../shared/types"
import type { ParamSweepAxis } from "../../shared/backtestSweepTypes"
import { metricValue, type HeatmapMetric } from "../../shared/sweepUtils"
import type { HeatmapData } from "../components/backtest/ParamHeatmap"

export type LabSweepCell = {
  values: Record<string, number>
  params: import("../../shared/types").StrategyParams
  ensemble?: import("../../shared/types").EnsembleMemberConfig[]
  metrics: BacktestResult["metrics"]
}

export type LabSweepResult = {
  axes: ParamSweepAxis[]
  cells: LabSweepCell[]
  bestCell: LabSweepCell
}

/** Project N-dimensional sweep onto a 2D heatmap (best cell per X/Y pair). */
export function sliceLabSweepToHeatmap(
  result: LabSweepResult,
  xAxisKey: string,
  yAxisKey: string,
  metric: HeatmapMetric,
  labels: Record<string, string>,
  depthAxisKey?: string,
  depthValue?: number | null
): HeatmapData | null {
  if (!result.cells.length) return null

  let pool = result.cells
  if (depthAxisKey && depthValue != null) {
    pool = pool.filter((c) => c.values[depthAxisKey] === depthValue)
    if (!pool.length) return null
  }

  const merged = new Map<string, LabSweepCell>()
  for (const cell of pool) {
    const x = cell.values[xAxisKey]
    const y = cell.values[yAxisKey]
    if (x === undefined || y === undefined) continue
    const key = `${x}|${y}`
    const existing = merged.get(key)
    if (!existing || metricValue(cell.metrics, metric) > metricValue(existing.metrics, metric)) {
      merged.set(key, cell)
    }
  }

  if (!merged.size) return null

  const cells: BacktestSweepCell[] = [...merged.values()].map((cell) => ({
    xValue: cell.values[xAxisKey]!,
    yValue: cell.values[yAxisKey]!,
    params: cell.params,
    ensemble: cell.ensemble,
    metrics: cell.metrics
  }))

  const xValues = [...new Set(cells.map((c) => c.xValue))].sort((a, b) => a - b)
  const yValues = [...new Set(cells.map((c) => c.yValue))].sort((a, b) => a - b)
  const bestCell = cells.reduce((best, cell) =>
    metricValue(cell.metrics, metric) > metricValue(best.metrics, metric) ? cell : best
  )

  return {
    paramXKey: xAxisKey,
    paramYKey: yAxisKey,
    paramXLabel: labels[xAxisKey] ?? xAxisKey,
    paramYLabel: labels[yAxisKey] ?? yAxisKey,
    xValues,
    yValues,
    cells,
    bestCell,
    source: "sweep"
  }
}

export function sortLabSweepCells(
  cells: LabSweepCell[],
  metric: HeatmapMetric,
  descending = true
): LabSweepCell[] {
  const dir = descending ? -1 : 1
  return [...cells].sort(
    (a, b) => dir * (metricValue(a.metrics, metric) - metricValue(b.metrics, metric))
  )
}

export function formatWeightSummary(weights: Record<string, number>, nameById: Record<string, string>) {
  return Object.entries(weights)
    .map(([id, w]) => `${nameById[id] ?? id}: ${w}`)
    .join(" · ")
}

export function uniqueAxisValues(cells: LabSweepCell[], axisKey: string): number[] {
  return [...new Set(cells.map((c) => c.values[axisKey]).filter((v) => v !== undefined))]
    .sort((a, b) => a - b)
}

export { formatAxisValuesSummary } from "../../shared/paramSweepUtils"
